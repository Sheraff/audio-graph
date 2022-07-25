type NodeUuid = string

interface Setting {
	type: 'string'
	readFrom: 'string'
	defaultValue: any
	event?: 'input' | 'change'
}

interface Structure {
	slots:
		{type: 'input', name: number}
		| {type: 'output', name: number}
		| {type: 'setting', name: string}
		| {type: 'custom', name: string}
	settings: {
		[name: string]: Setting
	}
	extras: Array<{type: string, name: number} & {[key: string]: any}>
}

type SettingRecord<TStruct extends Structure, TKey extends keyof TStruct['settings']> = {
	[name: TKey]: TStruct['settings'][TKey]['defaultValue']
}

type FromSlot = Structure['slots'] & {type: 'output'}
type ToSlot = Structure['slots'] & {type: 'input' | 'setting' | 'custom'}
type ConnectionReference<T extends FromSlot | ToSlot> = {
	nodeUuid: NodeUuid
	slot: T
}
type Connection = {
	from: ConnectionReference<FromSlot>
	to: ConnectionReference<ToSlot>
}
type SlotId<T extends ConnectionReference<FromSlot | ToSlot>> = `${T["nodeUuid"]}.${T["slot"]["type"]}.${T["slot"]["name"]}`
type ConnectionId = `${SlotId<Connection["from"]>}-${SlotId<Connection["to"]>}`

interface AnyNode extends AudioNode {}

interface GraphAudioNode<
	TType extends string,
	TStruct extends Structure,
	TNode extends AnyNode,
	TCustomNodes extends {[key: string]: AnyNode},
> {
	type: TType
	image: `${typeof process.env.PUBLIC_URL}/${string}.${'svg' | 'png'}`
	structure: TStruct
	requiredModules: Array<`${typeof process.env.PUBLIC_URL}/${string}.js`>
	isSink: boolean
	requiresSinkToPlay: boolean

	id: NodeUuid
	audioContext: AudioContext | null
	audioNode: TNode | null
	customNodes: TCustomNodes
	observableNodes: {
		[name: string]: ConstantSourceNode & {
			offset: AudioParam & {
				observer: AnalyserNode
			}
		}
	}
	establishedConnections: Set<ConnectionId>
	hasAudioDestination: boolean
	eventTarget: EventTarget | null
	ricId: number | null
	controller: AbortController

	data: {
		type: TType
		dom: {x: number, y: number}
		connections: Array<ConnectionId>
		extra: {[key: string]: any}
		settings: SettingRecord<TStruct, keyof TStruct['settings']>
	}

	constructor(
		id: NodeUuid,
		audioContext: string | AudioContext,
		initialPosition?: {x: number, y: number}
	): GraphAudioNode<TType,TStruct,TNode,TCustomNodes>

	makeInitialData(
		initialPosition?: {x: number, y:number}
	): [
		{
			type: TType
			dom: {x: number, y: number}
			connections: Array<ConnectionId>
			extra: {[key: string]: any}
			settings: SettingRecord<TStruct, keyof TStruct['settings']>
		},
		boolean
	]

	ownNodeConnection(
		action: 'connect' | 'disconnect',
		from: ConnectionReference<FromSlot>,
		to: ConnectionReference<ToSlot>,
		audioNode: AnyNode
	): void

	getDestinationAudioNode(
		connection: ConnectionReference<ToSlot>
	): TNode | AudioParam | null

	obtainAudioContext(
		audioContext: string | AudioContext
	): void

	initializeAudioNodes(
		audioContext: AudioContext
	): void

	updateSetting(
		name: keyof TStruct['settings']
	): void

	makeParamObservable(
		name: TNode extends AudioWorkletNode 
			? string 
			: TNode[keyof TNode] extends AudioParam 
				? keyof TNode
				: never
	): void
}

abstract class GraphAudioNode<
	TType extends string,
	TStruct extends Structure,
	TNode extends AnyNode,
	TCustomNodes extends {[key: string]: AnyNode},
> {
	static type
	static image
	static structure
	static requiredModules
	static isSink
	static requiresSinkToPlay

	constructor(id, audioContext, initialPosition) {
		this.id = id
		this.audioNode = null
		this.customNodes = {}
		this.audioContext = null
		this.ricId = null
		this.establishedConnections = new Set()
		this.controller = new AbortController()
		this.hasAudioDestination = false
		this.eventTarget = null

		const [data, isNew] = this.makeInitialData(initialPosition)

		this.data = data
		if(isNew)
			this.saveToLocalStorage()
		
		this.listenToConnections()
		this.obtainAudioContext(audioContext)
	}

	makeInitialData(initialPosition) {
		const save = localStorage.getItem(this.id)
		if (save) {
			const data = JSON.parse(save)
			return [data, false]
		} else {
			const Class = this.constructor as unknown as GraphAudioNode<TType,TStruct,TNode,TCustomNodes>
			const data = {
				type: Class.type,
				dom: initialPosition || {x: 0, y: 0},
				settings: Class.structure.settings
					? Object.fromEntries(
						Object.entries(Class.structure.settings)
							.map(([name, {defaultValue}]) => [name, defaultValue])
					)
					: {},
				connections: [],
				extra: {}
			}
			return [data, true]
		}
	}

	listenToConnections() {
		const onRequest = ({detail: {request, from, to, audioNode}}) => {
			const connectionId = GraphAudioNode.connectionToConnectionId({from, to})
			if (request === 'ack-connect') {
				this.establishedConnections.add(connectionId)
			} else if (request === 'ack-disconnect') {
				this.establishedConnections.delete(connectionId)
			} else if (request === 'connect') {
				if (this.establishedConnections.has(connectionId)) {
					console.warn('Connection already established')
					return
				}
				if (this.audioNode) {
					if (to.nodeUuid === this.id) {
						let responseAudioNode = this.getDestinationAudioNode(to)
						if (responseAudioNode) {
							window.dispatchEvent(new CustomEvent(from.nodeUuid, {detail: {request: 'connect', from, to, audioNode: responseAudioNode}}))
						} else {
							console.warn('No audio node found for connection')
						}
					} else if (from.nodeUuid === this.id) {
						if (audioNode) {
							this.ownNodeConnection('connect', from, to, audioNode)
							this.establishedConnections.add(connectionId)
							window.dispatchEvent(new CustomEvent(to.nodeUuid, {detail: {request: 'ack-connect', from, to}}))
						} else {
							window.dispatchEvent(new CustomEvent(to.nodeUuid, {detail: {request: 'connect', from, to}}))
							return
						}
					}
				}
				if (!this.data.connections.includes(connectionId)) {
					this.data.connections.push(connectionId)
					this.saveToLocalStorage()
				}
			} else if (request === 'disconnect') {
				if (!this.establishedConnections.has(connectionId)) {
					console.warn('Connection already disconnected')
					return
				}
				if (this.audioNode) {
					if (to.nodeUuid === this.id) {
						let responseAudioNode = this.getDestinationAudioNode(to)
						if (responseAudioNode) {
							window.dispatchEvent(new CustomEvent(from.nodeUuid, {detail: {request: 'disconnect', from, to, audioNode: responseAudioNode}}))
						} else {
							console.warn('No audio node found for disconnection')
						}
 					} else if (from.nodeUuid === this.id) {
						if (audioNode) {
							this.ownNodeConnection('disconnect', from, to, audioNode)
							this.establishedConnections.delete(connectionId)
							window.dispatchEvent(new CustomEvent(to.nodeUuid, {detail: {request: 'ack-disconnect', from, to}}))
						} else {
							window.dispatchEvent(new CustomEvent(to.nodeUuid, {detail: {request: 'disconnect', from, to}}))
							return
						}
					}
				}
				if (this.data.connections.includes(connectionId)) {
					this.data.connections.splice(this.data.connections.indexOf(connectionId), 1)
					this.saveToLocalStorage()
				}
			} else {
				console.warn('Unknown request', request)
			}
		}
		window.addEventListener(this.id, onRequest, {signal: this.controller.signal})
	}

	saveToLocalStorage() {
		if(!this.ricId) {
			this.ricId = requestIdleCallback(() => {
				this.ricId = null
				localStorage.setItem(this.id, JSON.stringify(this.data))
			})
		}
	}

	ownNodeConnection(action, from, to, audioNode) {
		if (!this.audioNode)
			return
		try {
			// TODO: handle custom nodes
			// TODO: handle channel assignment better
			// though it seems to work pretty well...
			if (typeof to.slot.name === 'string') {
				this.audioNode[action](audioNode, from.slot.name)
			} else {
				this.audioNode[action](audioNode, from.slot.name, to.slot.name)
			}
		} catch (e) {
			console.log('from', from, this.audioNode)
			console.log('to', to, audioNode)
			const connectionId = GraphAudioNode.connectionToConnectionId({from, to})
			console.error(`couldn't perform '${action}' on node ${this.constructor.type} (${connectionId}): ${e.message}`)
		}
	}

	getDestinationAudioNode(connection) {
		if (connection.slot.type === 'custom') {
			if (this.customNodes && (connection.slot.name in this.customNodes)) {
				return this.customNodes[connection.slot.name]
			}
			return null
		}
		if (!this.audioNode)
			return null
		if (connection.slot.type === 'input') {
			return this.audioNode
		}
		if (connection.slot.type === 'setting') {
			if (connection.slot.name in this.audioNode) {
				return this.audioNode[connection.slot.name]
			}
			if ('parameters' in this.audioNode) {
				const audioParam = this.audioNode.parameters.get(connection.slot.name)
				if (audioParam)
					return audioParam
			}
			return null
		}

		return null
	}

	obtainAudioContext(audioContext) {
		if (typeof audioContext === 'string') {
			const onContext = ({detail}) => {
				this.audioContext = detail
				this.createAudioNode()
			}
			window.addEventListener(audioContext, onContext, {once: true, signal: this.controller.signal})
		} else {
			this.audioContext = audioContext
			this.createAudioNode()
		}
	}

	initializeAudioNodes(audioContext) {
		throw new Error(`undefined initializeAudioNodes for ${this.constructor.name}`)
	}

	createAudioNode() {
		if (!this.audioContext) {
			console.warn('No audio context found')
			return 
		}
		this.initializeAudioNodes(this.audioContext)
		this.updateAudioNodeSettings()

		// establish connections
		this.data.connections.forEach((connectionId) => {
			if (!this.establishedConnections.has(connectionId)) {
				const {from, to} = GraphAudioNode.connectionIdToObjects(connectionId)
				window.dispatchEvent(new CustomEvent(to.nodeUuid, {detail: {request: 'connect', from, to}}))
			}
		})

		this.dispatchEvent(new CustomEvent('audio-node-created'))
	}

	updateAudioNodeSettings() {
		if (!this.audioContext) {
			console.warn('No audio context found')
			return
		}

		const Class = this.constructor
		Class.structure.settings?.forEach(({name}) => this.updateSetting(name))
	}

	updateSetting(name) {
		throw new Error(`undefined updateSetting for ${this.constructor.name}`)
	}

	onConnectionStatusChange(connected) {
		this.hasAudioDestination = connected

		Object.keys(this.observableNodes).forEach((name) => {
			if (connected && this.audioNode) {
				this.observableNodes[name].connect(this.observableNodes[name].offset.observer)
			} else if (!connected && this.audioNode) {
				this.observableNodes[name].disconnect(this.observableNodes[name].offset.observer)
			}
		})

		this.dispatchEvent(new CustomEvent('connection-status-change'))
	}


	observableNodes = {}
	makeParamObservable(name) {
		const audioParam = this.audioNode[name] || this.audioNode.parameters?.get(name)
		if (!audioParam) return

		this.observableNodes[name] = new ConstantSourceNode(this.audioContext, {offset: 0})
		this.observableNodes[name].start()
		this.observableNodes[name].connect(audioParam)
		Object.defineProperties(this.observableNodes[name].offset, {
			value: {
				get: ( ) => audioParam.value,
				set: (v) => audioParam.value = v,
			},
			minValue: { value: audioParam.minValue },
			maxValue: { value: audioParam.maxValue },
			observer: { value: new AnalyserNode(this.audioContext) },
		})
		this.observableNodes[name].connect(this.observableNodes[name].offset.observer)
		if (this.audioNode[name]) {
			Object.defineProperty(this.audioNode, name, {
				value: this.observableNodes[name].offset,
				enumerable: true,
			})
		} else {
			const getter = this.audioNode.parameters.get
			this.audioNode.parameters.get = (arg) => {
				if (arg === name) {
					return this.observableNodes[name].offset
				} else {
					return getter.call(this.audioNode.parameters, arg)
				}
			}
		}
	}

	disconnectAll() {
		this.establishedConnections.forEach((connectionId) => {
			const {from, to} = GraphAudioNode.connectionIdToObjects(connectionId)
			if (from.nodeUuid === this.id) {
				window.dispatchEvent(new CustomEvent(from.nodeUuid, {detail: {request: 'disconnect', from, to}}))
			} else if (to.nodeUuid === this.id && from.slot.type === 'output') {
				let responseAudioNode = this.getDestinationAudioNode(to)
				if (responseAudioNode) {
					window.dispatchEvent(new CustomEvent(from.nodeUuid, {detail: {request: 'disconnect', from, to, audioNode: responseAudioNode}}))
				} else {
					console.warn('could not find own already connected audio node for disconnectAll')
				}
			} else {
				console.warn('Unknown connection when disconnecting', from, to)
			}
		})
	}

	cleanup() {
		if (this.ricId)
			cancelIdleCallback(this.ricId)
		if (this.audioNode)
			this.disconnectAll()
	}

	destroy() {
		const postCleanup = () => {
			setTimeout(() => {
				requestIdleCallback(() => {
					if (this.establishedConnections.size > 0) {
						postCleanup()
					} else {
						this.controller.abort()
						localStorage.removeItem(this.id)
					}
				})
			}, 100)
		}

		const scheduleCleanup = () => {
			if (this.audioContext) {
				this.cleanup()
				postCleanup()
			} else {
				setTimeout(() => scheduleCleanup(), 100)
			}
		}

		scheduleCleanup()
	}

	static connectionIdToObjects(connectionId) {
		const [fromId, toId] = connectionId.split('-')
		const [fromNodeUuid, fromSlotType, fromSlotName] = fromId.split('.')
		const [toNodeUuid, toSlotType, toSlotName] = toId.split('.')
		const from = {nodeUuid: fromNodeUuid, slot: {type: fromSlotType, name: fromSlotName}}
		const to = {nodeUuid: toNodeUuid, slot: {type: toSlotType, name: toSlotName}}

		return {from, to}
	}

	static connectionToConnectionId({from, to}) {
		return `${from.nodeUuid}.${from.slot.type}.${from.slot.name}-${to.nodeUuid}.${to.slot.type}.${to.slot.name}`
	}

	get addEventListener() {
		if (!this.eventTarget) {
			this.eventTarget = new EventTarget()
		}
		return this.eventTarget.addEventListener.bind(this.eventTarget)
	}

	get removeEventListener() {
		if (!this.eventTarget) {
			return () => {}
		}
		return this.eventTarget.removeEventListener.bind(this.eventTarget)
	}

	dispatchEvent(event) {
		if (this.eventTarget) {
			this.eventTarget.dispatchEvent(event)
		}
	}
}

export default GraphAudioNode