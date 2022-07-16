/* eslint-disable */
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import styles from './index.module.css'

function Connections({nodeContainer, nodeRefs, onConnect}, ref) {
	const canvas = useRef(/** @type {HTMLCanvasElement} */(null))

	const [connections, setConnections] = useState(() => {
		const storedConnections = localStorage.getItem('connections')
		if (storedConnections) {
			return JSON.parse(storedConnections)
		}
		return [
			{
				from: '1.outputs.0',
				to: '0.inputs.0',
			}
		]
	})

	useEffect(() => {
		const observer = new ResizeObserver(([entry]) => {
			const { width, height } = entry.contentRect
			canvas.current.width = width
			canvas.current.height = height
		})
		observer.observe(canvas.current)
	}, [])

	const handle = useRef({x: 0, y: 0})
	useEffect(() => {
		const controller = new AbortController()
		window.addEventListener('mousemove', e => {
			handle.current.x = e.clientX
			handle.current.y = e.clientY
		}, {signal: controller.signal})
		return () => {
			controller.abort()
		}
	}, [])

	useEffect(() => {
		const controller = new AbortController()
		let dragging = false
		nodeContainer.current.addEventListener('slot-down', ({detail: {id, type}}) => {
			dragging = true
			setConnections((connections) => {
				const connectionIndex = connections.findIndex((connection) => connection[type] === id)
				if (connectionIndex > -1) {
					const newConnections = [...connections]
					newConnections[connectionIndex] = {
						...newConnections[connectionIndex],
						[type]: null
					}
					return newConnections
				}
				const otherType = type === 'from' ? 'to' : 'from'
				return [...connections, {
					[type]: id,
					[otherType]: null,
				}]
			})
		}, {signal: controller.signal})
		nodeContainer.current.addEventListener('slot-up', ({detail: {id, type}}) => {
			dragging = false
			setConnections((connections) => {
				makeConnection: {
					const connectionIndex = connections.findIndex((connection) => connection[type] === null)
					if (connectionIndex === -1)
						break makeConnection
					const otherType = type === 'from' ? 'to' : 'from'
					if (id.split('.')[0] === connections[connectionIndex][otherType].split('.')[0])
						break makeConnection
					const newConnections = [...connections]
					newConnections[connectionIndex] = {
						...connections[connectionIndex],
						[type]: id,
					}
					const existingConnectionIndex = connections.findIndex((connection) => connection[type] === id)
					if (existingConnectionIndex > -1)
						newConnections.splice(existingConnectionIndex, 1)
					return newConnections
				}
				return connections.filter(({from, to}) => from !== null && to !== null)
			})
		}, {signal: controller.signal})
		window.addEventListener('mouseup', () => {
			if(!dragging) return
			dragging = false
			setConnections((connections) => connections.filter(({from, to}) => from !== null && to !== null))
		}, {signal: controller.signal})
		return () => {
			controller.abort()
		}
	}, [nodeContainer])

	useEffect(() => {
		let rafId
		const ctx = canvas.current.getContext('2d')
		function getXY(id) {
			if(!id) return handle.current
			const [nodeId, type] = id.split('.')
			const node = nodeRefs.current.find(({id}) => id === nodeId)
			const slot = node.slots[id]
			const rect = slot.element.getBoundingClientRect()
			const isLeft = type === 'inputs'
			const x = isLeft ? rect.left : rect.right
			const y = rect.top + rect.height / 2
			return {x, y}
		}
		void function loop() {
			rafId = requestAnimationFrame(() => {
				ctx.strokeStyle = "#fff"
				ctx.fillStyle = "#fff"
				ctx.lineWidth = 4
				ctx.clearRect(0, 0, canvas.current.width, canvas.current.height)
				connections.forEach(({from, to}) => {
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
				})
				loop()
			})
		}()
		return () => {
			cancelAnimationFrame(rafId)
		}
	}, [connections])

	useImperativeHandle(ref, () => connections)

	useEffect(() => {
		onConnect()
		const ricID = requestIdleCallback(() => {
			localStorage.setItem(`connections`, JSON.stringify(connections))
		})
		return () => {
			cancelIdleCallback(ricID)
		}
	}, [connections])

	return (
		<canvas ref={canvas} className={styles.main}/>
	)
}

export default forwardRef(Connections)