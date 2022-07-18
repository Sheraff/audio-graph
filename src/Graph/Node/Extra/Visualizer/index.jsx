import { useEffect, useId, useRef, useState } from "react"
import styles from "./index.module.css"

const normalizeData = array => {
	const multiplier = Math.pow(Math.max(...array), -1)
	return array.map(n => n * multiplier)
}

const BUFFER_SIZE = 88220

export default function Visualizer({instance}) {
	const canvas = useRef(/** @type {HTMLCanvasElement} */(null))
	const adjust = useRef(/** @type {HTMLInputElement} */(null))
	const zoom = useRef(/** @type {HTMLInputElement} */(null))

	useEffect(() => {
		const ctx = canvas.current.getContext("2d")
		if(!ctx) return
		canvas.current.width = canvas.current.offsetWidth
		canvas.current.height = canvas.current.offsetHeight

		const array = new Float32Array(BUFFER_SIZE).fill(0)
		let timeout
		const resetOnTimeout = () => array.fill(0)
		const onMessage = ({data: {buffer}}) => {
			const data = new Float32Array(buffer)
			array.copyWithin(0, data.length, BUFFER_SIZE)
			array.set(data, BUFFER_SIZE - data.length)
			clearTimeout(timeout)
			timeout = setInterval(resetOnTimeout, 50)
		}
		if (instance.current.audioNode) {
			instance.current.audioNode.port.onmessage = onMessage
		} else {
			instance.current.onAudioNode = () => {
				instance.current.audioNode.port.onmessage = onMessage
			}
		}

		let rafId
		const SAMPLES = 100
		void function loop() {
			rafId = requestAnimationFrame((time) => {
				const sampleCount = Math.ceil(array.length / SAMPLES)
				const [samples] = array
					.slice(array.length - Number(zoom.current.value))
					.reduce(([samples, sum, count], v, i) => {
						sum += Math.abs(v)
						count++
						if((i + 1) % sampleCount === 0 || i + 1 === array.length) {
							samples.push(sum / count)
							sum = 0
							count = 0
						}
						return [samples, sum, count]
					}, [[], 0, 0])
				const normalized = normalizeData(samples)
				ctx.clearRect(0, 0, canvas.current.width, canvas.current.height)
				ctx.fillStyle = "#fff"
				const incrementWidth = canvas.current.width / (-1 + Number(zoom.current.value) / sampleCount)
				const number = Number(adjust.current.value)
				const adjustX = ((time/100) % number) / number
				normalized.forEach((v, i) => {
					const x = (i * incrementWidth + incrementWidth / 2 + adjustX * canvas.current.width) % canvas.current.width
					const y = v * canvas.current.height
					ctx.fillRect(x, (canvas.current.height - y) / 2, incrementWidth, y)
				})
				loop()
			})
		}()
		
		return () => {
			cancelAnimationFrame(rafId)
			clearTimeout(timeout)
		}
	}, [instance])

	const adjustId = useId()
	const zoomId = useId()
	useEffect(() => {
		const controller = new AbortController()
		const onChange = () => {
			if (!instance.current.data.extra.visualizer)
				instance.current.data.extra.visualizer = {}
			instance.current.data.extra.visualizer.adjust = adjust.current.value
			instance.current.data.extra.visualizer.zoom = zoom.current.value
			instance.current.saveToLocalStorage()
		}
		adjust.current.addEventListener("input", onChange, {signal: controller.signal, passive: true})
		zoom.current.addEventListener("input", onChange, {signal: controller.signal, passive: true})
		return () => {
			controller.abort()
		}
	}, [instance])
	return (
		<div className={styles.visualizer}>
			<canvas ref={canvas} width="400" height="100" className={styles.main} />
			<input ref={adjust} id={adjustId} type="range" min="1" max="120" step="0.5" defaultValue={instance.current.data.extra?.visualizer?.adjust ?? 1} className={styles.input} />
			<input ref={zoom} id={zoomId} type="range" min="44" max={BUFFER_SIZE} step="44" defaultValue={instance.current.data.extra?.visualizer?.zoom ?? 1} className={styles.input} />
			<label htmlFor={adjustId}>time window</label>
			<label htmlFor={zoomId}>sample size</label>
		</div>
	)
}