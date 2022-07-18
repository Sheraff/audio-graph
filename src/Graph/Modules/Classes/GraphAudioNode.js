/** 
 * @typedef {import('react')} React
 */

/**
 * @typedef {string} NodeUuid
 */

/**
 * @typedef {Object} FromSlotDefinition
 * @property {'output'} type
 * @property {number} key
 */

/**
 * @typedef {Object} ToInputSlotDefinition
 * @property {'input'} type
 * @property {number} key
 * 
 * @typedef {Object} ToSettingSlotDefinition
 * @property {'setting'} type
 * @property {string} key
 *
 * @typedef {Object} ToCustomSlotDefinition
 * @property {'custom'} type
 * @property {string | number} key
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
 * @typedef {`${T["nodeUuid"]}.${T["slot"]["type"]}.${T["slot"]["key"]}`} SlotId
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
	static get type() { throw new Error(`undefined type for ${this.constructor.name}`) }

	/** @type {`${typeof process.env.PUBLIC_URL}/${string}.${'svg' | 'png'}`} */
	static get image() { throw new Error(`undefined image for ${this.constructor.name}`) }

	/**
	 * @type {{
	 * 	slots: Array<FromSlotDefinition | ToSlotDefinition>
	 * settings: SettingDefinition[],
	 * }}
	 */
	static get structure() { throw new Error(`undefined structure for ${this.constructor.name}`) }

	/** @type {Array<`${typeof process.env.PUBLIC_URL}/${string}.js`>} */
	static get requiredModules() { throw new Error(`undefined requiredModules for ${this.constructor.name}`) }

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
		
		const save = localStorage.get(this.id)
		/**
		 * @type {{
		 * 	dom: {x: number, y: number},
		 * 	settings: {[name: SettingDefinition["name"]]: SettingDefinition["defaultValue"]}[],
		 * 	connections: ConnectionId[],
		 * 	extra: {[name: string]: any},
		 * }}
		 */
		this.data = save ? JSON.parse(save) : {
			dom: initialPosition,
			settings: Object.fromEntries(
				this.constructor.structure.settings.map(({name, defaultValue}) => [name, defaultValue])
			),
			connections: [],
			extra: {}
		}
		this.obtainAudioContext(audioContext)
	}

	listenToConnections() {
		/**
		 * @typedef {Object} ConnectionRequest
		 * @property {'connect' | 'disconnect'} request
		 * @property {ConnectionReference<FromSlotDefinition>} from
		 * @property {ConnectionReference<ToSlotDefinition>} to
		 * @property {AudioNode | AudioParam} audioNode
		 * @param {CustomEvent<ConnectionRequest>} event
		 */
		function onRequest({detail: {request, from, to, audioNode}}) {
			const connectionId = `${from.nodeUuid}.${from.slot.type}.${from.slot.key}-${to.nodeUuid}.${to.slot.type}.${to.slot.key}`
			if (request === 'connect') {
				if (this.establishedConnections.has(connectionId)) {
					console.warn('Connection already established')
					return
				}
				if(this.audioNode) {
					if (to.nodeUuid === this.id) {
						let responseAudioNode = this.getDestinationAudioNode(to)
						if (responseAudioNode) {
							window.dispatchEvent(new CustomEvent(from.nodeUuid, {detail: {request: 'connect', from, to, audioNode: responseAudioNode}}))
							this.establishedConnections.add(connectionId)
						} else {
							console.warn('No audio node found for connection')
						}
					} else if (from.nodeUuid === this.id) {
						this.ownNodeConnection('connect', from, to, audioNode)
						this.establishedConnections.add(connectionId)
					}
				}
				if (!this.data.connections.includes(connectionId)) {
					this.data.connections.push(connectionId)
					this.saveToLocalStorage()
				}
			} else if (request === 'disconnect') {
				if(
					this.audioNode
					&& this.establishedConnections.has(connectionId)
					&& from.nodeUuid === this.id
				) {
					this.ownNodeConnection('disconnect', from, to, audioNode)
					this.establishedConnections.delete(connectionId)
				}
				if (this.data.connections.includes(connectionId)) {
					this.data.connections.splice(this.data.connections.indexOf(connectionId), 1)
					this.saveToLocalStorage()
				}
			} else {
				console.warn('Unknown request', request)
			}
		}
		window.addEventListener(this.id, /** @type {EventListener} */(onRequest))
	}

	saveToLocalStorage() {
		if(!this.ricId) {
			this.ricId = requestIdleCallback(() => {
				this.ricId = null
				localStorage.set(this.id, JSON.stringify(this.data))
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
		if (typeof from.slot.key === 'string') {
			console.warn('should use a node other than the main audioNode channel')
			this.audioNode[action](audioNode)
		} else {
			if (typeof to.slot.key === 'string') {
				this.audioNode[action](audioNode, from.slot.key)
			} else {
				this.audioNode[action](audioNode, from.slot.key, to.slot.key)
			}
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
			if (connection.slot.key in this.audioNode) {
				responseAudioNode = this.audioNode[connection.slot.key]
			} else if('parameters' in this.audioNode && this.audioNode.parameters?.has(connection.slot.key)) {
				responseAudioNode = this.audioNode.parameters[connection.slot.key]
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
			window.addEventListener(audioContext, /** @type {EventListener} */(onContext), {once: true})
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
			const [fromNodeUuid, fromSlotType, fromSlotKey, toNodeUuid, toSlotType, toSlotKey] = c.split('-')
			const from = {nodeUuid: fromNodeUuid, slot: {type: fromSlotType, key: fromSlotKey}}
			const to = {nodeUuid: toNodeUuid, slot: {type: toSlotType, key: toSlotKey}}
			console.warn('audioNode is AudioNode|AudioParam, not necessarily main audio node `this.audioNode`')
			window.dispatchEvent(new CustomEvent(fromNodeUuid, {detail: {request: 'connect', from, to, audioNode: this.audioNode}}))
			if (fromNodeUuid === this.id) {
				this.establishedConnections.add(c)
			}
		})
	}

	updateAudioNodeSettings() {
		if (this.audioNode) {
			this.audioNode.gain.value = this.data.settings.gain
		}
	}

	disconnectAll() {
		this.establishedConnections.forEach((c) => {
			const [fromNodeUuid, fromSlotType, fromSlotKey, toNodeUuid, toSlotType, toSlotKey] = c.split('-')
			const from = {nodeUuid: fromNodeUuid, slot: {type: fromSlotType, key: fromSlotKey}}
			const to = {nodeUuid: toNodeUuid, slot: {type: toSlotType, key: toSlotKey}}
			if(from.nodeUuid === this.id) {
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
			this.audioNode.disconnect()
	}

	destroy() {
		this.cleanup()
		this.disconnectAll()
		localStorage.removeItem(this.id)
	}
}