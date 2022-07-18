import { useEffect, useRef } from "react"
import styles from './index.module.css'

export default function Connector({boundary, handles, children}) {
	const connections = useRef(new Map())
	const connectedSlots = useRef(new Map())
	const pendingConnection = useRef(null)
	const canvas = useRef(/** @type {HTMLCanvasElement} */(null))
	const mousePos = useRef({x: 0, y: 0})

	// initial state
	useEffect(() => {
		Object.entries(handles.current).forEach(([id, node]) => (
			node.connections.forEach((connectionId) => {
				const [fromId, toId] = connectionId.split('-')
				const [fromNodeId] = fromId.split('.')
				const [toNodeId] = toId.split('.')
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
		))
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
				// const x = boundary.current.scrollLeft
				// const y = boundary.current.scrollTop
				// ctx.save()
				// ctx.translate(x, y)
				connections.current.forEach(connection => drawConnection(connection))
				if (pendingConnection.current)
					drawConnection(pendingConnection.current)
				// ctx.restore()
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
				// handles.current[detail.nodeId].removeConnection('a', 'b')
				// handles.current[otherSlot.nodeId].removeConnection('a', 'b')
			}
			const thisKey = detail.left ? 'to' : 'from'
			const thisSlot = handles.current[detail.nodeId].slots[detail.id]
			pendingConnection.current = { [thisKey]: thisSlot }
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