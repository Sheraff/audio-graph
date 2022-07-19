import { useEffect, useRef } from "react"
import styles from "./index.module.css"

export default function Analyser({instance}) {
	const canvas = useRef(/** @type {HTMLCanvasElement} */(null))

	useEffect(() => {
		const ctx = canvas.current.getContext("2d")
		if(!ctx) return
		canvas.current.width = canvas.current.offsetWidth
		canvas.current.height = canvas.current.offsetHeight

		let array
		let bufferLength
		function makeBuffer() {
			bufferLength = instance.current.audioNode.frequencyBinCount
			array = new Uint8Array(bufferLength)
		}

		if (instance.current.audioNode) {
			makeBuffer()
		} else {
			instance.current.onAudioNode = () => {
				makeBuffer()
			}
		}

		let rafId
		void function loop() {
			rafId = requestAnimationFrame(() => {
				loop()
				if(!array)
					return
				if (instance.current.audioNode.frequencyBinCount !== bufferLength)
					makeBuffer()

				const type = instance.current.data.settings.type
				if (type === 'fourrier') {
					instance.current.audioNode.getByteFrequencyData(array)
				} else if (type === 'oscilloscope') {
					instance.current.audioNode.getByteTimeDomainData(array)
				}
				
				const sliceWidth = ctx.canvas.width * 1.0 / bufferLength;
				let x = 0
				ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
				ctx.strokeStyle = "#fff"
				ctx.beginPath()
				for (let i = 0; i < bufferLength; i++) {
					const v = array[i] / 128.0
					const y = ctx.canvas.height - v * ctx.canvas.height / 2
					if (i === 0) {
						ctx.moveTo(x, y)
					} else {
						ctx.lineTo(x, y)
					}
					x += sliceWidth
				}
				ctx.lineTo(ctx.canvas.width, ctx.canvas.height / 2)
  				ctx.stroke()
			})
		}()
		
		return () => {
			cancelAnimationFrame(rafId)
		}
	}, [instance])

	return (
		<canvas ref={canvas} width="400" height="100" className={styles.main} />
	)
}