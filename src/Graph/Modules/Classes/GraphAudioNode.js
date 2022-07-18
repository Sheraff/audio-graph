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
 */

/**
 * @typedef {Object} SelectSettingDefinition
 * @property {string} name
 * @property {'select'} type
 * @property {Array<string>} options
 * @property {string} defaultValue
 * @property {'value'} readFrom
 */

/**
 * @typedef {Object} TrackSettingDefinition
 * @property {string} name
 * @property {'track'} type
 * @property {Array<{x: number, y: number}>} defaultValue
 * @property {'points'} readFrom
 */

/**
 * @typedef {RangeSettingDefinition | SelectSettingDefinition | TrackSettingDefinition} SettingDefinition
 */

export default class GraphAudioNode {
	/** @type {string} */
	// static get type() { throw new Error(`undefined type for ${this.constructor.name}`) }
	// static set type(value) {this.type = value}

	/** @type {`${typeof process.env.PUBLIC_URL}/${string}.${'svg' | 'png'}`} */
	// static get image() { throw new Error(`undefined image for ${this.constructor.name}`) }
	// static set image(value) {this.image = value}

	/**
	 * @type {{
	 * 	slots: Array<FromSlotDefinition | ToSlotDefinition>
	 * 	settings: SettingDefinition[],
	 * }}
	 */
	// static get structure() { throw new Error(`undefined structure for ${this.constructor.name}`) }
	// static set structure(value) {this.structure = value}

	/** @type {Array<`${typeof process.env.PUBLIC_URL}/${string}.js`>} */
	// static get requiredModules() { throw new Error(`undefined requiredModules for ${this.constructor.name}`) }
	// static set requiredModules(value) {this.requiredModules = value}

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
			this.saveToLocalStorage()
		}

		this.listenToConnections()
		this.obtainAudioContext(audioContext)
	}

	listenToConnections() {
		/**
		 * @typedef {Object} ConnectionRequest
		 * @property {'connect' | 'disconnect'} request
		 * @property {ConnectionReference<FromSlotDefinition>} from
		 * @property {ConnectionReference<ToSlotDefinition>} to
		 * @property {AudioNode | AudioParam?} audioNode
		 * @param {CustomEvent<ConnectionRequest>} event
		 */
		const onRequest = ({detail: {request, from, to, audioNode}}) => {
			console.log('request', {request, from, to, audioNode})
			const connectionId = `${from.nodeUuid}.${from.slot.type}.${from.slot.name}-${to.nodeUuid}.${to.slot.type}.${to.slot.name}`
			if (request === 'connect') {
				if (this.establishedConnections.has(connectionId)) {
					console.warn('Connection already established')
					return
				}
				if (this.audioNode) {
					if (to.nodeUuid === this.id) {
						let responseAudioNode = this.getDestinationAudioNode(to)
						if (responseAudioNode) {
							window.dispatchEvent(new CustomEvent(from.nodeUuid, {detail: {request: 'connect', from, to, audioNode: responseAudioNode}}))
							this.establishedConnections.add(connectionId)
						} else {
							console.warn('No audio node found for connection')
						}
					} else if (from.nodeUuid === this.id) {
						if (audioNode) {
							this.ownNodeConnection('connect', from, to, audioNode)
							this.establishedConnections.add(connectionId)
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
							this.establishedConnections.delete(connectionId)
						} else {
							console.warn('No audio node found for disconnection')
						}
 					} else if (from.nodeUuid === this.id) {
						if (audioNode) {
							this.ownNodeConnection('disconnect', from, to, audioNode)
							this.establishedConnections.delete(connectionId)
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
		console.log('listen on ', this.id)
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
	 * @param {AudioNode | AudioParam} audioNode 
	 */
	ownNodeConnection(action, from, to, audioNode) {
		if (!this.audioNode)
			return
		if (typeof to.slot.name === 'string') {
			this.audioNode[action](audioNode, from.slot.name)
		} else {
			this.audioNode[action](audioNode, from.slot.name, to.slot.name)
		}
	}

	/**
	 * @param {ConnectionReference<ToSlotDefinition>} connection
	 * @returns {AudioNode | AudioParam?}
	 */
	getDestinationAudioNode(connection) {
		if(!this.audioNode)
			return null
		let responseAudioNode = null
		if (connection.slot.type === 'input') {
			responseAudioNode = this.audioNode
		} else if (connection.slot.type === 'setting') {
			if (connection.slot.name in this.audioNode) {
				responseAudioNode = this.audioNode[connection.slot.name]
			} else if('parameters' in this.audioNode && this.audioNode.parameters?.has(connection.slot.name)) {
				responseAudioNode = this.audioNode.parameters[connection.slot.name]
			}
		}
		return responseAudioNode
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
			console.warn('audioNode is AudioNode|AudioParam, not necessarily main audio node `this.audioNode`')
			window.dispatchEvent(new CustomEvent(toNodeUuid, {detail: {request: 'connect', from, to}}))
			console.log('initial requests', toNodeUuid, {detail: {request: 'connect', from, to}})
			// if (fromNodeUuid === this.id) {
			// 	this.establishedConnections.add(c)
			// }
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
				window.dispatchEvent(new CustomEvent(fromNodeUuid, {detail: {request: 'disconnect', from, to, audioNode: this.audioNode}}))
			} else if (to.nodeUuid === this.id && from.slot.type === 'output') {
				this.ownNodeConnection('disconnect', from, to, this.audioNode)
			} else {
				console.warn('Unknown connection when disconnecting', from, to)
			}
		})
		this.establishedConnections.clear()
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