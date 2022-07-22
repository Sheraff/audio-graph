import { useEffect, useRef } from "react"
import styles from './index.module.css'

function parseNodeMap(nodeMap) {
	// find all the leaf nodes
	const outputLeafs = new Set()
	nodeMap.forEach((node) => {
		if(node.isSink)
			outputLeafs.add(node)
	})

	// find all nodes that are ancestors of any output leaf
	const connectedNodes = new Set([...outputLeafs])
	let newParents = [...outputLeafs]
	while (newParents.length > 0) {
		const futureParents = []
		newParents.forEach((node) => {
			node.parents.forEach((parent) => {
				if (!connectedNodes.has(parent)) {
					connectedNodes.add(parent)
					futureParents.push(parent)
				}
			})
		})
		newParents = futureParents
	}

	return connectedNodes
}

function addNodeToNodeMap(id, nodeMap, handles) {
	if (!nodeMap.current.has(id)) {
		nodeMap.current.set(id, {
			parents: new Set(),
			children: new Set(),
			isSink: handles.current[id].Class.isSink,
		})
	}
}

const CONNECTED_STATUS = Symbol('connected')

function parseAndDispatchNodeMap(nodeMap, handles) {
	const connectedNodes = parseNodeMap(nodeMap.current)
	nodeMap.current.forEach((node, id) => {
		const currentConnectionStatus = connectedNodes.has(node)
		handles.current[id]?.onDestinationChange(currentConnectionStatus)
		const audioNodeInstance = handles.current[id]?.instance
		if (audioNodeInstance) {
			if (currentConnectionStatus !== audioNodeInstance[CONNECTED_STATUS]) {
				audioNodeInstance.onConnectionStatusChange?.(currentConnectionStatus)
			}
			audioNodeInstance[CONNECTED_STATUS] = currentConnectionStatus
		}
		
	})
}

function addPair(fromNodeId, toNodeId, nodeMap) {
	nodeMap.current.get(fromNodeId).children.add(nodeMap.current.get(toNodeId))
	nodeMap.current.get(toNodeId).parents.add(nodeMap.current.get(fromNodeId))
}

function deletePair(fromNodeId, toNodeId, nodeMap) {
	nodeMap.current.get(fromNodeId).children.delete(nodeMap.current.get(toNodeId))
	nodeMap.current.get(toNodeId).parents.delete(nodeMap.current.get(fromNodeId))
}

export default function Connector({boundary, handles, children}) {
	const connections = useRef(new Map())
	const connectedSlots = useRef(new Map())
	const pendingConnection = useRef(null)
	const canvas = useRef(/** @type {HTMLCanvasElement} */(null))
	const mousePos = useRef({x: 0, y: 0})
	const nodeMap = useRef(new Map())

	// initial state
	useEffect(() => {
		Object.entries(handles.current).forEach(([id, node]) => {
			addNodeToNodeMap(id, nodeMap, handles)
			node.connections.forEach((connectionId) => {
				const [fromId, toId] = connectionId.split('-')
				const [fromNodeId] = fromId.split('.')
				const [toNodeId, toSlotType] = toId.split('.')
				const from = handles.current[fromNodeId]?.slots[fromId]
				const to = handles.current[toNodeId]?.slots[toId]
				if (!from || !to) {
					// TODO: this `return` only happens if we have bad data. find out why we sometimes have bad data.
					console.warn('Bad initial connection data:', connectionId, fromId, toId, from, to)
					return
				}
				addNodeToNodeMap(fromNodeId, nodeMap, handles)
				addNodeToNodeMap(toNodeId, nodeMap, handles)
				const fromNode = handles.current[fromNodeId]
				if (!fromNode.Class.requiresSinkToPlay || toSlotType !== 'setting') {
					addPair(fromNodeId, toNodeId, nodeMap)
				}
				connections.current.set(
					connectionId,
					{
						from: handles.current[fromNodeId].slots[fromId],
						to: handles.current[toNodeId].slots[toId],
					}
				)
				connectedSlots.current.set(fromId, connectionId)
				connectedSlots.current.set(toId, connectionId)
			})
		})
		parseAndDispatchNodeMap(nodeMap, handles)
	}, [handles])

	// draw
	useEffect(() => {
		const ctx = canvas.current.getContext('2d')
		if(!ctx) throw new Error('could not acquire canvas context')
		let rafId
		function getXY(slot) {
			if(!slot) return mousePos.current
			const rect = slot.element.getBoundingClientRect()
			const x = slot.input ? rect.left : rect.right
			const y = rect.top + rect.height / 2
			return {x, y}
		}
		function drawConnection({from, to}) {
			const {x: fromX, y: fromY} = getXY(from)
			const {x: toX, y: toY} = getXY(to)
			ctx.beginPath()
			ctx.moveTo(fromX, fromY)
			ctx.bezierCurveTo(
				fromX + 50, fromY,
				toX - 50, toY,
				toX, toY
			)
			ctx.stroke()
			ctx.beginPath()
			ctx.arc(fromX, fromY, 8, 0, Math.PI * 2)
			ctx.fill()
			ctx.beginPath()
			ctx.arc(toX, toY, 8, 0, Math.PI * 2)
			ctx.fill()
		}
		void function loop() {
			rafId = requestAnimationFrame(() => {

				connections.current.forEach(({from, to}) => {
					if(!handles.current[from.nodeId] || !handles.current[to.nodeId]) {
						const connectionId = connectedSlots.current.get(from.id) || connectedSlots.current.get(to.id)
						connectedSlots.current.delete(from.id)
						connectedSlots.current.delete(to.id)
						connections.current.delete(connectionId)
					}
				})

				ctx.strokeStyle = "#fff"
				ctx.fillStyle = "#fff"
				ctx.lineWidth = 4
				ctx.clearRect(0, 0, canvas.current.width, canvas.current.height)
				connections.current.forEach(connection => drawConnection(connection))
				if (pendingConnection.current)
					drawConnection(pendingConnection.current)
				loop()
			})
		}()
		return () => {
			cancelAnimationFrame(rafId)
		}
	}, [boundary, handles])

	// resolution
	useEffect(() => {
		const observer = new ResizeObserver(([entry]) => {
			const { width, height } = entry.contentRect
			canvas.current.width = width
			canvas.current.height = height
		})
		observer.observe(canvas.current)
		return () => {
			observer.disconnect()
		}
	}, [])

	// free floating connections
	useEffect(() => {
		const controller = new AbortController()
		
		window.addEventListener('mousemove', (e) => {
			mousePos.current.x = e.clientX
			mousePos.current.y = e.clientY
		}, {signal: controller.signal})
		
		return () => {
			controller.abort()
		}
	}, [])

	// resolve slot events
	useEffect(() => {
		const controller = new AbortController()
		let dragging = false

		// boundary.current.addEventListener('node-added', ({detail: {id, type}}) => {
		// 	if (!nodeMap.current.has(id)) {
		// 		nodeMap.current.set(id, { parents: new Set(), children: new Set(), type })
		// 	}
		// })

		boundary.current.addEventListener('node-removed', ({detail: {id}}) => {
			const current = nodeMap.current.get(id)
			if (!current) return // if a node was never connected, it won't be in the map
			current.parents.forEach(parent => { parent.children.delete(current) })
			current.children.forEach(child => { child.parents.delete(current) })
			nodeMap.current.delete(id)
			parseAndDispatchNodeMap(nodeMap, handles)
		})

		boundary.current.addEventListener('slot-down', ({detail}) => {
			dragging = true
			const isConnected = connectedSlots.current.get(detail.id)
			if (isConnected) {
				const existingConnection = connections.current.get(isConnected)
				const otherKey = detail.left ? 'from' : 'to'
				const otherSlot = existingConnection[otherKey]
				connections.current.delete(isConnected)
				connectedSlots.current.delete(otherSlot.id)
				connectedSlots.current.delete(detail.id)
				const fromSlot = detail.left ? otherSlot : detail
				const toSlot = detail.left ? detail : otherSlot
				const from = {nodeUuid: fromSlot.nodeId, slot: fromSlot}
				const to = {nodeUuid: toSlot.nodeId, slot: toSlot}
				window.dispatchEvent(new CustomEvent(to.nodeUuid, {detail: {request: 'disconnect', from, to}}))
				pendingConnection.current = { [otherKey]: otherSlot }
				
				deletePair(from.nodeUuid, to.nodeUuid, nodeMap)
				parseAndDispatchNodeMap(nodeMap, handles)
			} else {
				const thisKey = detail.left ? 'to' : 'from'
				const thisSlot = handles.current[detail.nodeId].slots[detail.id]
				pendingConnection.current = { [thisKey]: thisSlot }
			}
		}, {signal: controller.signal})
		
		boundary.current.addEventListener('slot-up', ({detail}) => {
			if(!dragging) return
			dragging = false

			const thisKey = detail.left ? 'to' : 'from'
			const thisSlot = handles.current[detail.nodeId].slots[detail.id]
			const [otherKey, otherSlot] = Object.entries(pendingConnection.current)[0]
			pendingConnection.current = null

			if (thisKey === otherKey) {
				return
			}

			const isConnected = connectedSlots.current.get(detail.id)
			if (isConnected) {
				const existingConnection = connections.current.get(isConnected)
				const otherKey = detail.left ? 'from' : 'to'
				const otherSlot = existingConnection[otherKey]
				connections.current.delete(isConnected)
				connectedSlots.current.delete(otherSlot.id)
				const fromSlot = detail.left ? otherSlot : detail
				const toSlot = detail.left ? detail : otherSlot
				const from = {nodeUuid: fromSlot.nodeId, slot: fromSlot}
				const to = {nodeUuid: toSlot.nodeId, slot: toSlot}
				window.dispatchEvent(new CustomEvent(to.nodeUuid, {detail: {request: 'disconnect', from, to}}))

				deletePair(from.nodeUuid, to.nodeUuid, nodeMap)
			}
			
			const fromSlot = thisKey === 'from' ? thisSlot : otherSlot
			const toSlot = fromSlot === otherSlot ? thisSlot : otherSlot
			const connectionId = `${fromSlot.id}-${toSlot.id}`
			connections.current.set(connectionId, {from: fromSlot, to: toSlot})
			connectedSlots.current.set(fromSlot.id, connectionId)
			connectedSlots.current.set(toSlot.id, connectionId)
			const from = {nodeUuid: fromSlot.nodeId, slot: fromSlot}
			const to = {nodeUuid: toSlot.nodeId, slot: toSlot}
			window.dispatchEvent(new CustomEvent(to.nodeUuid, {detail: {request: 'connect', from, to}}))
			
			addNodeToNodeMap(from.nodeUuid, nodeMap, handles)
			addNodeToNodeMap(to.nodeUuid, nodeMap, handles)
			const fromNode = handles.current[from.nodeUuid]
			if (!fromNode.Class.requiresSinkToPlay || to.slot.type !== 'setting') {
				addPair(from.nodeUuid, to.nodeUuid, nodeMap)
			}
			parseAndDispatchNodeMap(nodeMap, handles)
		}, {signal: controller.signal})

		window.addEventListener('mouseup', () => {
			if(!dragging) return
			dragging = false
			pendingConnection.current = null
		}, {signal: controller.signal})
		
		return () => {
			controller.abort()
		}
	}, [boundary, handles])

	return (
		<>
			<canvas ref={canvas} className={styles.main} />
			{children}
		</>
	)
}