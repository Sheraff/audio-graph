import { useContext, useEffect, useRef, useState } from "react"
import { GraphAudioContext } from "../../../GraphAudioContext"
import styles from "./index.module.css"

function normalizePoints(canvas, points) {
	const xRange = canvas.offsetWidth
	const yRange = canvas.offsetHeight / 2
	const value = points.map(point => ({
		x: point.x / xRange,
		y: (yRange - point.y) / yRange,
	}))
	return value
}

function localizePoints(canvas, points) {
	const xRange = canvas.offsetWidth
	const yRange = canvas.offsetHeight / 2
	const value = points.map(point => ({
		x: point.x * xRange,
		y: yRange - point.y * yRange,
	}))
	return value
}

export default function AutomationTrack({id, name, defaultValue, settings, instance}){
	const canvas = useRef(/** @type {HTMLCanvasElement} */(null))
	const input = useRef(/** @type {HTMLInputElement} */(null))
	const [initialValue, setInitialValue] = useState([])
	const touched = useRef(false)

	useEffect(() => {
		canvas.current.width = canvas.current.offsetWidth
		canvas.current.height = canvas.current.offsetHeight
	}, [])

	useEffect(() => {
		if (!touched.current && Array.isArray(defaultValue))
			setInitialValue((former) => {
				if (former.length && !defaultValue.length)
					return former
				return localizePoints(canvas.current, defaultValue)
			})
	}, [defaultValue])

	const audioContext = useContext(GraphAudioContext)

	useEffect(() => {
		const ctx = canvas.current.getContext("2d")
		if(!ctx) return

		const points = initialValue
		const controller = new AbortController()
		let grabbing = false
		let lastIndex
		let hasMoved = false
		let rafId
		const DISTANCE_TO_GRAB = 20
		let path

		Object.defineProperty(input.current, 'points', {
			get: () => normalizePoints(canvas.current, points),
			configurable: true
		})

		function dispatch() {
			touched.current = true
			input.current.dispatchEvent(new Event("input", {bubbles: true}))
		}
		if (points?.length)
			dispatch()

		function draw() {
			if(rafId) return
			rafId = requestAnimationFrame(() => {
				rafId = null
				ctx.clearRect(0, 0, canvas.current.width, canvas.current.height)

				if (!path) {
					path = new Path2D()
					path.moveTo(0, canvas.current.height * 0.25)
					path.lineTo(canvas.current.width, canvas.current.height * 0.25)
					path.moveTo(0, canvas.current.height * 0.5)
					path.lineTo(canvas.current.width, canvas.current.height * 0.5)
					path.moveTo(0, canvas.current.height * 0.75)
					path.lineTo(canvas.current.width, canvas.current.height * 0.75)
					path.moveTo(canvas.current.width * 0.25, 0)
					path.lineTo(canvas.current.width * 0.25, canvas.current.height)
					path.moveTo(canvas.current.width * 0.5, 0)
					path.lineTo(canvas.current.width * 0.5, canvas.current.height)
					path.moveTo(canvas.current.width * 0.75, 0)
					path.lineTo(canvas.current.width * 0.75, canvas.current.height)
				}

				ctx.strokeStyle = "#fff2"
				ctx.stroke(path)

				if (typeof audioContext !== 'string' && settings.tempo && instance.current.hasAudioDestination) {
					const factor = 60 / Number(settings.tempo) * 4
					ctx.strokeStyle = "#811ff9"
					const progress = (audioContext.currentTime % factor) / factor
					ctx.beginPath()
					ctx.moveTo(progress * canvas.current.width, 0)
					ctx.lineTo(progress * canvas.current.width, canvas.current.height)
					ctx.stroke()
				}

				ctx.fillStyle = "#fff"
				ctx.strokeStyle = "#fff"
				const firstPointIsStart = points[0]?.x === 0
				const firstPointY = firstPointIsStart ? points[0]?.y : canvas.current.height / 2
				const firstPointIndex = firstPointIsStart ? 1 : 0
				const lastPointIsEnd = points.at(-1)?.x === canvas.current.width
				const lastPointY = points.at(-1)?.y ?? canvas.current.height / 2
				const lastPointIndex = lastPointIsEnd ? points.length - 1 : points.length

				ctx.beginPath()
				ctx.moveTo(0, firstPointY)
				for (let i = firstPointIndex; i < lastPointIndex; i++) {
					ctx.lineTo(points[i].x, points[i].y)
				}
				ctx.lineTo(canvas.current.width, lastPointY)
				ctx.stroke()
				points.forEach((point, i) => {
					if (lastIndex === i) {
						ctx.beginPath()
						ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI)
						ctx.stroke()
					}
					ctx.beginPath()
					ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI)
					ctx.fill()
				})
				if (typeof audioContext !== 'string') {
					draw()
				}
			})
		}
		draw()

		canvas.current.addEventListener('mousemove', e => {
			if (!grabbing){
				const existingPointIndex = points.findIndex(p => Math.hypot(p.x - e.offsetX, p.y - e.offsetY) < DISTANCE_TO_GRAB)
				canvas.current.style.cursor = (existingPointIndex > -1) ? 'grab' : 'crosshair'
				lastIndex = existingPointIndex
				draw()
			} else {
				hasMoved = true
				const minX = points[lastIndex - 1]?.x ?? 0
				const maxX = points[lastIndex + 1]?.x ?? canvas.current.width
				points[lastIndex].x = Math.max(minX, Math.min(maxX, e.offsetX))
				points[lastIndex].y = Math.max(0, Math.min(canvas.current.height, e.offsetY))
				draw()
			}
		}, {passive: true, signal: controller.signal})

		canvas.current.addEventListener('mousedown', e => {
			hasMoved = false
			const existingPointIndex = points.findIndex(p => Math.hypot(p.x - e.offsetX, p.y - e.offsetY) < DISTANCE_TO_GRAB)
			if (existingPointIndex > -1) {
				grabbing = true
				lastIndex = existingPointIndex
				canvas.current.style.cursor = 'grabbing'
			} else {
				const x = e.offsetX
				const y = e.offsetY
				let index = points.findIndex(p => p.x > x)
				if (index === -1) index = points.length
				points.splice(index, 0, {
					x: Math.max(0, Math.min(canvas.current.width, x)),
					y: Math.max(0, Math.min(canvas.current.height, y)),
				})
				grabbing = true
				lastIndex = index
				canvas.current.style.cursor = 'grabbing'
				draw()
				dispatch()
			}
		}, {passive: true, signal: controller.signal})

		canvas.current.addEventListener('mouseup', e => {
			if(!grabbing) return
			if(!hasMoved) {
				points.splice(lastIndex, 1)
			}
			grabbing = false
			canvas.current.style.cursor = 'crosshair'
			draw()
			dispatch()
		}, {passive: true, signal: controller.signal})

		canvas.current.addEventListener('mouseleave', e => {
			if (!grabbing) return

			let {x, y} = points[lastIndex]
			if (x < DISTANCE_TO_GRAB)
				x = 0
			else if (x > canvas.current.width - DISTANCE_TO_GRAB)
				x = canvas.current.width
			if (y < DISTANCE_TO_GRAB)
				y = 0
			else if (y > canvas.current.height - DISTANCE_TO_GRAB)
				y = canvas.current.height
			points[lastIndex].x = x
			points[lastIndex].y = y
			draw()
			dispatch()
			grabbing = false
			canvas.current.style.cursor = 'crosshair'
		}, {passive: true, signal: controller.signal})

		return () => {
			controller.abort()
			cancelAnimationFrame(rafId)
		}
	}, [initialValue, audioContext, settings, instance])

	return (
		<>
			<canvas ref={canvas} width="400" height="100" className={styles.main} />
			<input ref={input} id={id} name={name} className={styles.input} />
		</>
	)
}