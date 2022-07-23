import { useContext, useEffect, useRef, useState } from "react"
import { GraphAudioContext } from "../../../GraphAudioContext"
import styles from "./index.module.css"

export default function Splice({id, name, defaultValue, instance}){
	const canvas = useRef(/** @type {HTMLCanvasElement} */(null))
	const input = useRef(/** @type {HTMLInputElement} */(null))
	const [initialValue, setInitialValue] = useState(defaultValue)
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
				return defaultValue
			})
	}, [defaultValue])

	const audioContext = useContext(GraphAudioContext)

	useEffect(() => {
		const ctx = canvas.current.getContext("2d")
		if(!ctx) return

		const bounds = Array.isArray(initialValue) ? initialValue : [0, 1]
		const controller = new AbortController()
		let rafId

		Object.defineProperty(input.current, 'bounds', {
			get: () => [bounds[0], bounds[1]],
			configurable: true
		})

		function dispatch() {
			touched.current = true
			input.current.dispatchEvent(new Event("input", {bubbles: true}))
		}
		if (bounds?.length)
			dispatch()

		let previousBuffer
		let path
		function updatePath() {
			previousBuffer = instance.current.buffer
			const a = instance.current.buffer.getChannelData(0)
			const b = instance.current.buffer.numberOfChannels === 2 && instance.current.buffer.getChannelData(1)
			const SAMPLE_SIZE = Math.max(1, Math.floor(a.length / Math.max(1, ctx.canvas.width)))
			let max = 0
			const [result] = a
				.reduce(([samples, sum, count], _value, i, array) => {
					const value = Math.abs(_value) + (b ? Math.abs(b[i]) : 0)
					sum += Math.abs(value)
					count++
					if((i + 1) % SAMPLE_SIZE === 0 || i + 1 === array.length) {
						const sample = sum / count
						samples.push(sample)
						if (sample > max)
							max = sample
						sum = 0
						count = 0
					}
					return [samples, sum, count]
				}, [[], 0, 0])
			const normalized = result.map((value) => value / max)
			path = new Path2D()
			const incrementSize = ctx.canvas.width / normalized.length
			normalized.forEach((value, i) => {
				const x = incrementSize * i
				const dy = value * ctx.canvas.height
				const y = (ctx.canvas.height - dy) / 2
				path.rect(x, y, incrementSize, dy)
			})
		}

		function draw() {
			if(rafId) return
			rafId = requestAnimationFrame(() => {
				rafId = null
				draw()
				ctx.clearRect(0, 0, canvas.current.width, canvas.current.height)
				if (!instance.current.buffer)
					return
				if (previousBuffer !== instance.current.buffer)
					updatePath()

				ctx.fillStyle = "#fff"
				ctx.fill(path)

				ctx.fillStyle = "#fff4"
				ctx.fillRect(0, 0, ctx.canvas.width * bounds[0], ctx.canvas.height)
				ctx.fillRect(ctx.canvas.width * bounds[1], 0, ctx.canvas.width, ctx.canvas.height)

				if (typeof audioContext !== 'string' && instance.current.startTime !== null) {
					const [start, end] = instance.current.data.settings.select
					const delta = end - start
					const duration = instance.current.buffer.duration / instance.current.data.settings.playbackRate
					const factor = duration * delta
					const progress = ((audioContext.currentTime - instance.current.startTime) % factor) / factor
					const x = (start + progress * delta) * canvas.current.width
					ctx.strokeStyle = "#811ff9"
					ctx.beginPath()
					ctx.moveTo(x, 0)
					ctx.lineTo(x, canvas.current.height)
					ctx.stroke()
				}
			})
		}
		draw()

		let start = null
		canvas.current.addEventListener('mousedown', (e) => {
			start = e.offsetX
		}, {signal: controller.signal})
		canvas.current.addEventListener('mousemove', (e) => {
			if(start === null) return
			const current = e.offsetX
			const min = Math.min(start, current)
			const max = Math.max(start, current)
			bounds[0] = Math.max(0, min / canvas.current.width)
			bounds[1] = Math.min(1, max / canvas.current.width)
		}, {signal: controller.signal})
		window.addEventListener('mouseup', (e) => {
			if(start === null) return
			start = null
			dispatch()
		}, {signal: controller.signal})

		return () => {
			controller.abort()
			cancelAnimationFrame(rafId)
		}
	}, [initialValue, audioContext, instance])

	return (
		<>
			<canvas ref={canvas} width="400" height="100" className={styles.main} />
			<input ref={input} id={id} name={name} className={styles.input} defaultValue={''} />
		</>
	)
}