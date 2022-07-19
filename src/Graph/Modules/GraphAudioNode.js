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
 * @property {[0, 1]} defaultValue
 * @property {'bounds'} readFrom
 * @property {'input'?} event
 */

/**
 * @typedef {RangeSettingDefinition | SelectSettingDefinition | TrackSettingDefinition | SequenceSettingDefinition | FileSettingDefinition} SettingDefinition
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

	/**
	 * @param {NodeUuid} id 
	 * @param {AudioContext | string} audioContext 
	 * @param {React.MutableRefObject<{}>} controls
	 * @param {{x: number, y: number}?} initialPosition
	 */
	constructor(id, audioContext, controls, initialPosition) {
		this.id = id
		
		/** @type {AudioNode | AudioWorkletNode?} */
		this.audioNode = null
		
		/** @type {Object<string, AudioNode | AudioWorkletNode?>} */
		this.customNodes = {}
		
		/** @type {AudioContext?} */
		this.audioContext = null

		/** @type {number?} */
		this.ricId = null

		/** @type {Set<ConnectionId>} */
		this.establishedConnections = new Set()

		/** @type {React.MutableRefObject<{}>} */
		this.controls = controls
		
		/** @type {typeof GraphAudioNode} */
		const Class = this.constructor
		const save = localStorage.getItem(this.id)

		this.controller = new AbortController()

		/**
		 * @type {{
		 * 	dom: {x: number, y: number},
		 * 	settings: {[name: SettingDefinition["name"]]: SettingDefinition["defaultValue"]}[],
		 * 	connections: ConnectionId[],
		 * 	extra: {[name: string]: any},
		 * }}
		 */
		this.data = null
		if (save) {
			this.data = JSON.parse(save)
		} else {
			this.data = {
				dom: initialPosition,
				settings: Class.structure.settings
					? Object.fromEntries(
						Class.structure.settings.map(({name, defaultValue}) => [name, defaultValue])
					)
					: {},
				connections: [],
				extra: {}
			}
			this.saveToLocalStorage(true)
		}

		this.listenToConnections()
		this.obtainAudioContext(audioContext)
	}

	listenToConnections() {
		/**
		 * @typedef {Object} ConnectionRequest
		 * @property {'connect' | 'disconnect' | 'ack-connect' | 'ack-disconnect'} request
		 * @property {ConnectionReference<FromSlotDefinition>} from
		 * @property {ConnectionReference<ToSlotDefinition>} to
		 * @property {AudioNode | AudioParam?} audioNode
		 * @param {CustomEvent<ConnectionRequest>} event
		 */
		const onRequest = ({detail: {request, from, to, audioNode}}) => {
			const connectionId = `${from.nodeUuid}.${from.slot.type}.${from.slot.name}-${to.nodeUuid}.${to.slot.type}.${to.slot.name}`
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
				if(this.audioNode) {
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

	saveToLocalStorage(force = false) {
		if(!this.ricId) {
			this.ricId = requestIdleCallback(() => {
				this.ricId = null
				if (force || localStorage.getItem(this.id))
					localStorage.setItem(this.id, JSON.stringify(this.data))
			})
		}
	}

	/**
	 * @param {'connect' | 'disconnect'} action 
	 * @param {ConnectionReference<FromSlotDefinition>} from 
	 * @param {ConnectionReference<ToSlotDefinition>} to 
	 * @param {AudioNode | AudioParam} audioNode 
	 */
	ownNodeConnection(action, from, to, audioNode) {
		if (!this.audioNode)
			return
		try {
			// TODO: handle custom nodes
			// TODO: handle channel assignment better
			if (typeof to.slot.name === 'string') {
				this.audioNode[action](audioNode, from.slot.name)
			} else {
				this.audioNode[action](audioNode, from.slot.name, to.slot.name)
			}
		} catch (e) {
			console.log(from, this.audioNode)
			console.log(to, audioNode)
			console.error(`couldn't perform '${action}' on node`, e)
		}
	}

	/**
	 * @param {ConnectionReference<ToSlotDefinition>} connection
	 * @returns {AudioNode | AudioParam?}
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
			if ('parameters' in this.audioNode && this.audioNode.parameters.has(connection.slot.name)) {
				return this.audioNode.parameters.get(connection.slot.name)
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
		this.data.connections.forEach((c) => {
			const [fromId, toId] = c.split('-')
			const [fromNodeUuid, fromSlotType, fromSlotName] = fromId.split('.')
			const [toNodeUuid, toSlotType, toSlotName] = toId.split('.')
			const from = {nodeUuid: fromNodeUuid, slot: {type: fromSlotType, name: fromSlotName}}
			const to = {nodeUuid: toNodeUuid, slot: {type: toSlotType, name: toSlotName}}
			window.dispatchEvent(new CustomEvent(toNodeUuid, {detail: {request: 'connect', from, to}}))
		})
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

	disconnectAll() {
		this.establishedConnections.forEach((c) => {
			const [fromId, toId] = c.split('-')
			const [fromNodeUuid, fromSlotType, fromSlotName] = fromId.split('.')
			const [toNodeUuid, toSlotType, toSlotName] = toId.split('.')
			const from = {nodeUuid: fromNodeUuid, slot: {type: fromSlotType, name: fromSlotName}}
			const to = {nodeUuid: toNodeUuid, slot: {type: toSlotType, name: toSlotName}}
			if (from.nodeUuid === this.id) {
				window.dispatchEvent(new CustomEvent(fromNodeUuid, {detail: {request: 'disconnect', from, to}}))
			} else if (to.nodeUuid === this.id && from.slot.type === 'output') {
				window.dispatchEvent(new CustomEvent(fromNodeUuid, {detail: {request: 'disconnect', from, to, audioNode: this.audioNode}}))
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
		this.controller.abort()
	}

	destroy() {
		this.cleanup()
		localStorage.removeItem(this.id)
	}
}