import { useEffect, useId, useRef } from "react"
import styles from "./index.module.css"

const normalizeData = array => {
	const multiplier = Math.pow(Math.max(...array), -1)
	return array.map(n => n * multiplier)
}

function Visualizer({id}) {
	const canvas = useRef(/** @type {HTMLCanvasElement} */(null))
	const adjust = useRef(/** @type {HTMLInputElement} */(null))
	const zoom = useRef(/** @type {HTMLInputElement} */(null))

	useEffect(() => {
		const ctx = canvas.current.getContext("2d")
		if(!ctx) return
		canvas.current.width = canvas.current.offsetWidth
		canvas.current.height = canvas.current.offsetHeight

		const bufferSize = 88200
		const controller = new AbortController()
		const array = new Float32Array(bufferSize).fill(0)
		
		window.addEventListener(id, e => {
			const data = new Float32Array(e.detail.buffer)
			array.copyWithin(0, data.length, bufferSize)
			array.set(data, bufferSize - data.length)
		}, {signal: controller.signal})

		let rafId
		const SAMPLES = 100
		void function loop() {
			rafId = requestAnimationFrame((time) => {
				const sampleCount = Math.ceil(array.length / SAMPLES)
				const [samples] = array
					.slice(0, Number(zoom.current.value))
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
				const incrementWidth = canvas.current.width / (Number(zoom.current.value) / sampleCount)
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
			controller.abort()
			cancelAnimationFrame(rafId)
		}
	}, [id])

	const adjustId = useId()
	const zoomId = useId()
	return (
		<div className={styles.visualizer}>
			<canvas ref={canvas} width="400" height="100" className={styles.main} />
			<input ref={adjust} id={adjustId} type="range" min="1" max="100" defaultValue="1" className={styles.input} />
			<input ref={zoom} id={zoomId} type="range" min="44" max="88200" defaultValue="22000" className={styles.input} />
			<label htmlFor={adjustId}>time window</label>
			<label htmlFor={zoomId}>sample size</label>
		</div>
	)
}

export default function Extra({type, id}) {
	if (type === 'visualizer')
		return <Visualizer id={id} />
	return null
}