
type NodeUuid = string

interface FromSlotDefinition {
	type: 'output'
	name: number
}

interface ToInputSlotDefinition {
	type: 'input'
	name: number

}
interface ToSettingSlotDefinition {
	type: 'setting'
	name: string

}
interface ToCustomSlotDefinition {
	type: 'custom'
	name: string | number

}
type ToSlotDefinition =
	ToInputSlotDefinition
	| ToSettingSlotDefinition
	| ToCustomSlotDefinition

type ConnectionReference<T extends FromSlotDefinition | ToSlotDefinition> = {
	nodeUuid: NodeUuid
	slot: T
}

type Connection = {
	from: ConnectionReference<FromSlotDefinition>
	to: ConnectionReference<ToSlotDefinition>
}

type SlotId<
	T extends ConnectionReference<FromSlotDefinition | ToSlotDefinition>
> = `${T["nodeUuid"]}.${T["slot"]["type"]}.${T["slot"]["name"]}`
type ConnectionId = `${SlotId<Connection["from"]>}-${SlotId<Connection["to"]>}`

type RangeSettingDefinition = {
	type: 'range'
	props: {
		min: number
		max: number
		step: number
	}
	defaultValue: number
	readFrom: 'value'
	event?: 'input' | 'change'
}

type FileSettingDefinition = {
	type: 'file'
	props: {
		accept: string
	}
	defaultValue: ''
	readFrom: 'files'
	event?: 'change'
}

type SelectSettingDefinition = {
	type: 'select'
	options: Array<string>
	defaultValue: string
	readFrom: 'value'
	event?: 'input' | 'change'
}

type TrackSettingDefinition = {
	type: 'track'
	defaultValue: Array<{x: number, y: number}>
	readFrom: 'points'
	event?: 'input'
}

type SequenceSettingDefinition = {
	type: 'select'
	defaultValue: [number, number]
	readFrom: 'bounds'
	event?: 'input'
}

type SettingDefinition =
	RangeSettingDefinition
	| SelectSettingDefinition
	| TrackSettingDefinition
	| SequenceSettingDefinition
	| FileSettingDefinition

type NodeData = {
	type: string,
	dom: {x: number, y: number},
	settings: {[name: string]: SettingDefinition["defaultValue"]},
	connections: ConnectionId[],
	extra: {[name: string]: any},
}

// type IconImage = `${typeof process.env.PUBLIC_URL}/${string}.${'svg' | 'png'}`
type IconImage = string

type NodeDefinition = {
	slots: Array<FromSlotDefinition | ToSlotDefinition>
	settings?: {[name: string]: SettingDefinition},
	extras?: Array<{
		type: string,
		name: string | number,
		[key: string]: any,
	}>
}

type RequiresWorklets = Array<`${typeof process.env.PUBLIC_URL}/${string}.js`>

type AudioNodeGraphType = 
	BaseAudioContext['destination']
	| AudioWorkletNode
	| AnalyserNode

export default class GraphAudioNode<T, U extends NodeDefinition> {
	static get type(): string { throw new Error(`undefined type for ${this.constructor.name}`) }
	static set type(value: string) { Object.defineProperty(this, 'type', {value, writable: false, configurable: false}) }

	static get image(): IconImage { throw new Error(`undefined image for ${this.constructor.name}`) }
	static set image(value: IconImage) { Object.defineProperty(this, 'image', {value, writable: false, configurable: false}) }

	// static get structure() { throw new Error(`undefined structure for ${this.constructor.name}`) }
	// static set structure(value) { Object.defineProperty(this, 'structure', {value, writable: false, configurable: false}) }

	static get requiredModules(): RequiresWorklets { throw new Error(`undefined requiredModules for ${this.constructor.name}`) }
	static set requiredModules(value: RequiresWorklets) { Object.defineProperty(this, 'requiredModules', {value, writable: false, configurable: false}) }

	/* whether this node is an audio destination node */
	static get isSink(): boolean { throw new Error(`undefined isSink for ${this.constructor.name}`) }
	static set isSink(value: boolean) { Object.defineProperty(this, 'isSink', {value, writable: false, configurable: false}) }
	
	/* whether this node can still emit a signal without being connected to a destination node */
	static get requiresSinkToPlay(): boolean { throw new Error(`undefined requiresSinkToPlay for ${this.constructor.name}`) }
	static set requiresSinkToPlay(value: boolean) { Object.defineProperty(this, 'requiresSinkToPlay', {value, writable: false, configurable: false}) }

	id: NodeUuid
	audioNode: T | null
	customNodes?: {[key: string]: AudioNodeGraphType}
	observableNodes: {[key: string]: ConstantSourceNode & {offset: AudioParam & {observer: AnalyserNode}}}
	audioContext: AudioContext | null
	ricId: number | null
	establishedConnections: Set<ConnectionId>
	controller: AbortController
	hasAudioDestination: boolean
	eventTarget: EventTarget | null
	data: NodeData
	constructor(
		id: NodeUuid,
		audioContext: AudioContext | string,
		initialPosition?: {x: number, y: number}
	) {
		this.id = id
		this.audioNode = null
		this.customNodes = {}
		this.observableNodes = {}
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

	makeInitialData(initialPosition?: {x: number, y: number}): [NodeData, boolean] {
		const save = localStorage.getItem(this.id)
		if (save) {
			const data = JSON.parse(save)
			return [data, false]
		} else {
			const Class = this.constructor as typeof GraphAudioNode
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
		const onRequest = ({
			detail: {
				request,
				from,
				to,
				audioNode,
			}
		}: CustomEvent<{
			request: 'connect' | 'disconnect' | 'ack-connect' | 'ack-disconnect'
			from: ConnectionReference<FromSlotDefinition>
			to: ConnectionReference<ToSlotDefinition>
			audioNode?: AudioNode | AudioParam
		}>) => {
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
		window.addEventListener(
			this.id,
			onRequest as EventListener,
			{signal: this.controller.signal}
		)
	}

	saveToLocalStorage() {
		if (!this.ricId) {
			this.ricId = requestIdleCallback(() => {
				this.ricId = null
				localStorage.setItem(this.id, JSON.stringify(this.data))
			})
		}
	}

	ownNodeConnection<U>(
		action: 'connect' | 'disconnect',
		from: ConnectionReference<FromSlotDefinition>,
		to: ConnectionReference<ToSlotDefinition>,
		audioNode: U | AudioParam
	) {
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
		} catch (error) {
			console.log('from', from, this.audioNode)
			console.log('to', to, audioNode)
			const connectionId = GraphAudioNode.connectionToConnectionId({from, to})
			const Class = this.constructor as typeof GraphAudioNode
			const message = error && typeof error === 'object' && (error as Error).message
			console.error(`couldn't perform '${action}' on node ${Class.type} (${connectionId}): ${message}`)
		}
	}

	getDestinationAudioNode(connection: ConnectionReference<ToSlotDefinition>): T | AudioParam | null {
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
				const audioParam = (this.audioNode as AudioWorkletNode).parameters.get(connection.slot.name)
				if (audioParam)
					return audioParam
			}
			return null
		}

		return null
	}

	obtainAudioContext(audioContext: AudioContext | string) {
		if (typeof audioContext === 'string') {
			const onContext = ({detail}: CustomEvent<AudioContext>) => {
				this.audioContext = detail
				this.createAudioNode()
			}
			window.addEventListener(
				audioContext,
				onContext as EventListener,
				{once: true, signal: this.controller.signal}
			)
		} else {
			this.audioContext = audioContext
			this.createAudioNode()
		}
	}

	initializeAudioNodes(audioContext: AudioContext) {
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
		const Class = this.constructor as typeof GraphAudioNode
		Object.keys(Class.structure.settings).forEach((name) => this.updateSetting(name))
	}

	updateSetting(name: keyof (typeof GraphAudioNode<T>['structure']['settings'])) {
		throw new Error(`undefined updateSetting for ${this.constructor.name}`)
	}

	onConnectionStatusChange(connected: boolean) {
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

	makeParamObservable(name: keyof U['settings']) {
		if (!this.audioNode || !this.audioContext) {
			console.error('call to `makeParamObservable` must come after this.audioNode initialization')
			return
		}
		if (!(name in this.audioNode) && !(this.audioNode as AudioWorkletNode).parameters?.has(name)) {
			return
		}
		const audioParam = (
			(this.audioNode as T)[name]
			|| (this.audioNode as AudioWorkletNode).parameters?.get(name)
		) as AudioParam

		const observableNode = new ConstantSourceNode(this.audioContext, {offset: 0})
		observableNode.start()
		observableNode.connect(audioParam)
		Object.defineProperties(observableNode.offset, {
			value: {
				get: ( ) => audioParam.value,
				set: (v) => audioParam.value = v,
			},
			minValue: { value: audioParam.minValue },
			maxValue: { value: audioParam.maxValue },
			observer: { value: new AnalyserNode(this.audioContext) },
		})
		// @ts-ignore: IDK how to type `defineProperties`
		this.observableNodes[name] = observableNode
		// @ts-ignore: IDK how to type `defineProperties`
		observableNode.connect(observableNode.offset.observer)
		
		if ((this.audioNode as AudioNode)[name]) {
			Object.defineProperty(this.audioNode, name, {
				value: observableNode.offset,
				enumerable: true,
			})
		} else {
			const parameters = (this.audioNode as AudioWorkletNode).parameters
			const getter = parameters.get
			parameters.get = (arg) => {
				if (arg === name) {
					return observableNode.offset
				} else {
					return getter.call(parameters, arg)
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

	static connectionIdToObjects(connectionId: ConnectionId): Connection {
		const [fromId, toId] = connectionId.split('-')
		const [fromNodeUuid, fromSlotType, fromSlotName] = fromId.split('.')
		const [toNodeUuid, toSlotType, toSlotName] = toId.split('.')
		const from = {nodeUuid: fromNodeUuid, slot: {type: fromSlotType, name: fromSlotName}}
		const to = {nodeUuid: toNodeUuid, slot: {type: toSlotType, name: toSlotName}}

		// @ts-ignore -- this works as long as names don't contain '.' or '-' themselves
		return {from, to}
	}

	static connectionToConnectionId({from, to}: Connection): ConnectionId {
		return `${from.nodeUuid}.${from.slot.type}.${from.slot.name}-${to.nodeUuid}.${to.slot.type}.${to.slot.name}`
	}

	/**
	 * @type {EventTarget['addEventListener']}
	 */
	get addEventListener() {
		if (!this.eventTarget) {
			this.eventTarget = new EventTarget()
		}
		return this.eventTarget.addEventListener.bind(this.eventTarget)
	}

	/**
	 * @type {EventTarget['removeEventListener']}
	 */
	get removeEventListener() {
		if (!this.eventTarget) {
			return () => {}
		}
		return this.eventTarget.removeEventListener.bind(this.eventTarget)
	}

	dispatchEvent(event: Event | CustomEvent) {
		if (this.eventTarget) {
			this.eventTarget.dispatchEvent(event)
		}
	}
}