import { useContext, useEffect, useRef } from "react"
import { GraphAudioContext } from "../../../GraphAudioContext"
import styles from "./index.module.css"

export default function Waveform({instance}) {
	const canvas = useRef(/** @type {HTMLCanvasElement} */(null))
	const audioContext = useContext(GraphAudioContext)

	useEffect(() => {
		if(typeof audioContext === 'string') return
		const ctx = canvas.current.getContext("2d")
		if(!ctx) return
		canvas.current.width = canvas.current.offsetWidth
		canvas.current.height = canvas.current.offsetHeight

		const controller = new AbortController()

		let array
		let bufferLength
		function makeBuffer() {
			bufferLength = instance.current.audioNode.frequencyBinCount
			array = new Float32Array(bufferLength)
		}

		if (instance.current.audioNode) {
			makeBuffer()
		} else {
			instance.current.addEventListener('audio-node-created', () => {
				makeBuffer()
			}, {once: true, signal: controller.signal})
		}

		let rafId
		let offset = 0
		function loop() {
			rafId = requestAnimationFrame(() => {
				loop()
				if(!array)
					return
				if (instance.current.audioNode.frequencyBinCount !== bufferLength)
					makeBuffer()

				instance.current.audioNode.getFloatTimeDomainData(array)
				const SAMPLE_SIZE = instance.current.data.settings.sample
				const WIDTH_PER_SAMPLE = 1
				const [result] = array
					.reduce(([samples, sum, count], value, i, array) => {
						sum += Math.abs(value)
						count++
						if((i + 1) % SAMPLE_SIZE === 0 || i + 1 === array.length) {
							const sample = sum / count
							samples.push(sample * 0.8)
							sum = 0
							count = 0
						}
						return [samples, sum, count]
					}, [[], 0, 0])
				const pathWidth = result.length * WIDTH_PER_SAMPLE
				const path = new Path2D()
				result.forEach((value, i) => {
					const x = (offset + WIDTH_PER_SAMPLE * i) % ctx.canvas.width
					const dy = value * ctx.canvas.height
					const y = (ctx.canvas.height - dy) / 2
					path.rect(x, y, WIDTH_PER_SAMPLE, dy)
				})
				ctx.clearRect(offset, 0, pathWidth, ctx.canvas.height)
				const extra = offset + pathWidth - ctx.canvas.width
				if(extra > 0)
					ctx.clearRect(0, 0, extra, ctx.canvas.height)
				ctx.fillStyle = "#fff"
				ctx.fill(path)

				const cursor = extra > 0 ? extra + 1 : offset+pathWidth+1
				ctx.strokeStyle = "#811ff9"
				ctx.beginPath()
				ctx.moveTo(cursor, 0)
				ctx.lineTo(cursor, canvas.current.height)
				ctx.stroke()
				offset += pathWidth
				offset %= ctx.canvas.width
			})
		}

		audioContext.addEventListener('statechange', (event) => {
			if(audioContext.state === 'running')
				loop()
			else 
				cancelAnimationFrame(rafId)
		}, {signal: controller.signal})
		if(audioContext.state === 'running')
			loop()
		
		return () => {
			cancelAnimationFrame(rafId)
			controller.abort()
		}
	}, [instance, audioContext])

	return (
		<canvas ref={canvas} width="400" height="100" className={styles.main} />
	)
}