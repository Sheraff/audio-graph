/**
 * @typedef {BaseAudioContext['destination']| AudioWorkletNode | AudioBufferSourceNode | AnalyserNode | GainNode | ConstantSourceNode | BiquadFilterNode | OscillatorNode | ChannelMergerNode | StereoPannerNode | ChannelSplitterNode | DelayNode | DynamicsCompressorNode} AudioNodeTypes
 */

/** 
 * @typedef {import('react')} React
 */

/**
 * @typedef {string} NodeUuid
 */

/**
 * @typedef {Object} FromSlotDefinition
 * @property {'output'} type
 * @property {number} name
 */

/**
 * @typedef {Object} ToInputSlotDefinition
 * @property {'input'} type
 * @property {number} name
 * 
 * @typedef {Object} ToSettingSlotDefinition
 * @property {'setting'} type
 * @property {string} name
 *
 * @typedef {Object} ToCustomSlotDefinition
 * @property {'custom'} type
 * @property {string | number} name
 * 
 * @typedef {ToInputSlotDefinition | ToSettingSlotDefinition | ToCustomSlotDefinition} ToSlotDefinition
 */

/**
 * @template {FromSlotDefinition | ToSlotDefinition} T
 * @typedef {Object} ConnectionReference
 * @property {NodeUuid} nodeUuid
 * @property {T} slot
 */

/**
 * @typedef {Object} Connection
 * @property {ConnectionReference<FromSlotDefinition>} from
 * @property {ConnectionReference<ToSlotDefinition>} to
 */

/**
 * @template {ConnectionReference<FromSlotDefinition | ToSlotDefinition>} T
 * @typedef {`${T["nodeUuid"]}.${T["slot"]["type"]}.${T["slot"]["name"]}`} SlotId
 */

/**
 * @typedef {`${SlotId<Connection["from"]>}-${SlotId<Connection["to"]>}`} ConnectionId
 */

/**
 * @typedef {Object} RangeSettingDefinition
 * @property {string} name
 * @property {'range'} type
 * @property {Object} props
 * @property {number} props.min
 * @property {number} props.max
 * @property {number} props.step
 * @property {number} defaultValue
 * @property {'value'} readFrom
 * @property {'input' | 'change'?} event
 */

/**
 * @typedef {Object} FileSettingDefinition
 * @property {string} name
 * @property {'file'} type
 * @property {Object} props
 * @property {string} props.accept
 * @property {''} defaultValue
 * @property {'files'} readFrom
 * @property {'change'?} event
 */

/**
 * @typedef {Object} SelectSettingDefinition
 * @property {string} name
 * @property {'select'} type
 * @property {Array<string>} options
 * @property {string} defaultValue
 * @property {'value'} readFrom
 * @property {'input' | 'change'?} event
 */

/**
 * @typedef {Object} TrackSettingDefinition
 * @property {string} name
 * @property {'track'} type
 * @property {Array<{x: number, y: number}>} defaultValue
 * @property {'points'} readFrom
 * @property {'input'?} event
 */

/**
 * @typedef {Object} SequenceSettingDefinition
 * @property {string} name
 * @property {'select'} type
 * @property {[number, number]} defaultValue
 * @property {'bounds'} readFrom
 * @property {'input'?} event
 */

/**
 * @typedef {RangeSettingDefinition | SelectSettingDefinition | TrackSettingDefinition | SequenceSettingDefinition | FileSettingDefinition} SettingDefinition
 */

/**
 * @typedef {{
 * 	type: string,
 * 	dom: {x: number, y: number},
 * 	settings: {[Key in SettingDefinition["name"]]: SettingDefinition["defaultValue"]},
 * 	connections: ConnectionId[],
 * 	extra: {[name: string]: any},
 * }} NodeData
 */



export default class GraphAudioNode {
	/** @type {string} */
	static get type() { throw new Error(`undefined type for ${this.constructor.name}`) }
	static set type(value) { Object.defineProperty(this, 'type', {value, writable: false, configurable: false}) }

	/** @type {`${typeof process.env.PUBLIC_URL}/${string}.${'svg' | 'png'}`} */
	static get image() { throw new Error(`undefined image for ${this.constructor.name}`) }
	static set image(value) { Object.defineProperty(this, 'image', {value, writable: false, configurable: false}) }

	/**
	 * @type {{
	 * 	slots: Array<FromSlotDefinition | ToSlotDefinition>
	 * 	settings: SettingDefinition[],
	 * }}
	 */
	static get structure() { throw new Error(`undefined structure for ${this.constructor.name}`) }
	static set structure(value) { Object.defineProperty(this, 'structure', {value, writable: false, configurable: false}) }

	/** @type {Array<`${typeof process.env.PUBLIC_URL}/${string}.js`>} */
	static get requiredModules() { throw new Error(`undefined requiredModules for ${this.constructor.name}`) }
	static set requiredModules(value) { Object.defineProperty(this, 'requiredModules', {value, writable: false, configurable: false}) }

	/** @type {boolean} whether this node is an audio destination node */
	static get isSink() { throw new Error(`undefined isSink for ${this.constructor.name}`) }
	static set isSink(value) { Object.defineProperty(this, 'isSink', {value, writable: false, configurable: false}) }
	get isSink() { return this.constructor.isSink }
	set isSink(value) { Object.defineProperty(this, 'isSink', {value, writable: true, configurable: true}) }

	/** @type {boolean} whether this node can still emit a signal without being connected to a destination node */
	static get requiresSinkToPlay() { throw new Error(`undefined requiresSinkToPlay for ${this.constructor.name}`) }
	static set requiresSinkToPlay(value) { Object.defineProperty(this, 'requiresSinkToPlay', {value, writable: false, configurable: false}) }
	get requiresSinkToPlay() { return this.constructor.requiresSinkToPlay }
	set requiresSinkToPlay(value) { Object.defineProperty(this, 'requiresSinkToPlay', {value, writable: true, configurable: true}) }

	/**
	 * @param {NodeUuid} id 
	 * @param {AudioContext | string} audioContext
	 * @param {{x: number, y: number}?} initialPosition
	 */
	constructor(id, audioContext, initialPosition) {
		this.id = id
		
		/** @type {AudioNodeTypes?} */
		this.audioNode = null
		
		/** @type {Object<string, AudioNodeTypes?>} */
		this.customNodes = {}
		
		/** @type {AudioContext?} */
		this.audioContext = null

		/** @type {number?} */
		this.ricId = null

		/** @type {Set<ConnectionId>} */
		this.establishedConnections = new Set()

		/** @type {AbortController} */
		this.controller = new AbortController()

		/** @type {boolean} */
		this.hasAudioDestination = false

		/** @type {EventTarget?} */
		this.eventTarget = null

		const [data, isNew] = this.makeInitialData(initialPosition)

		/** @type {NodeData} */
		this.data = data
		if(isNew)
			this.saveToLocalStorage()
		
		this.listenToConnections()
		this.obtainAudioContext(audioContext)
	}

	/**
	 * @param {{x: number, y: number}?} initialPosition 
	 * @returns {[NodeData, boolean]}
	 */
	makeInitialData(initialPosition) {
		const save = localStorage.getItem(this.id)
		if (save) {
			const data = JSON.parse(save)
			return [data, false]
		} else {
			const Class = /** @type {typeof GraphAudioNode} */(this.constructor)
			const data = {
				type: Class.type,
				dom: initialPosition || {x: 0, y: 0},
				settings: Class.structure.settings
					? Object.fromEntries(
						Class.structure.settings.map(({name, defaultValue}) => [name, defaultValue])
					)
					: {},
				connections: [],
				extra: {}
			}
			return [data, true]
		}
	}

	listenToConnections() {
		/**
		 * @typedef {Object} ConnectionRequest
		 * @property {'connect' | 'disconnect' | 'ack-connect' | 'ack-disconnect'} request
		 * @property {ConnectionReference<FromSlotDefinition>} from
		 * @property {ConnectionReference<ToSlotDefinition>} to
		 * @property {AudioNodeTypes | AudioParam?} audioNode
		 * @param {CustomEvent<ConnectionRequest>} event
		 */
		const onRequest = ({detail: {request, from, to, audioNode}}) => {
			/** @type {ConnectionId} */
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
							console.warn('No audio node found for connection', from, to)
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
		window.addEventListener(this.id, /** @type {EventListener} */(onRequest), {signal: this.controller.signal})
	}

	saveToLocalStorage() {
		if(!this.ricId) {
			this.ricId = requestIdleCallback(() => {
				this.ricId = null
				localStorage.setItem(this.id, JSON.stringify(this.data))
			})
		}
	}

	/**
	 * @param {'connect' | 'disconnect'} action 
	 * @param {ConnectionReference<FromSlotDefinition>} from 
	 * @param {ConnectionReference<ToSlotDefinition>} to 
	 * @param {AudioNodeTypes | AudioParam} audioNode 
	 */
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

	/**
	 * @param {ConnectionReference<ToSlotDefinition>} connection
	 * @returns {AudioNodeTypes | AudioParam?}
	 */
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

	/**
	 * @param {AudioContext | string} audioContext 
	 */
	obtainAudioContext(audioContext) {
		if (typeof audioContext === 'string') {
			/**
			 * @param {CustomEvent<AudioContext>} event
			 */
			const onContext = ({detail}) => {
				this.audioContext = detail
				this.createAudioNode()
			}
			window.addEventListener(audioContext, /** @type {EventListener} */(onContext), {once: true, signal: this.controller.signal})
		} else {
			this.audioContext = audioContext
			this.createAudioNode()
		}
	}

	/** @param {AudioContext} audioContext */
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
		/** @type {typeof GraphAudioNode} */
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

	/** @type {Object<string, ConstantSourceNode>} */
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

	/**
	 * @param {ConnectionId} connectionId 
	 * @returns {Connection}
	 */
	static connectionIdToObjects(connectionId) {
		const [fromId, toId] = connectionId.split('-')
		const [fromNodeUuid, fromSlotType, fromSlotName] = fromId.split('.')
		const [toNodeUuid, toSlotType, toSlotName] = toId.split('.')
		const from = {nodeUuid: fromNodeUuid, slot: {type: fromSlotType, name: fromSlotName}}
		const to = {nodeUuid: toNodeUuid, slot: {type: toSlotType, name: toSlotName}}

		return {from, to}
	}

	/**
	 * @param {Connection} connection
	 * @returns {ConnectionId}
	 */
	static connectionToConnectionId({from, to}) {
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

	/**
	 * @param {Event | CustomEvent} event 
	 */
	dispatchEvent(event) {
		if (this.eventTarget) {
			this.eventTarget.dispatchEvent(event)
		}
	}
}