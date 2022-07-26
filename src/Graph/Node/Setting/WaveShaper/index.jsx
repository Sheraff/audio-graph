import { useEffect, useRef } from "react"
import styles from "./index.module.css"

export default function WaveShaper({id, name, defaultValue, settings}){
	const canvas = useRef(/** @type {HTMLCanvasElement} */(null))
	const input = useRef(/** @type {HTMLInputElement} */(null))

	useEffect(() => {
		canvas.current.width = canvas.current.offsetWidth
		canvas.current.height = canvas.current.offsetHeight
	}, [])

	useEffect(() => {
		const ctx = canvas.current.getContext("2d")
		if(!ctx) return

		const points = [...defaultValue]
		const controller = new AbortController()

		Object.defineProperty(input.current, 'wave', {
			get: () => points,
			configurable: true
		})

		function dispatch(type = 'input') {
			input.current.dispatchEvent(new Event(type, {bubbles: true}))
		}

		let rafId
		let path
		function draw() {
			if(rafId) return
			rafId = requestAnimationFrame(() => {
				rafId = null
				ctx.clearRect(0, 0, canvas.current.width, canvas.current.height)

				if (!path) {
					path = new Path2D()
					path.moveTo(0, canvas.current.height * 0.5)
					path.lineTo(canvas.current.width, canvas.current.height * 0.5)
				}
				ctx.strokeStyle = "#fff2"
				ctx.stroke(path)

				ctx.fillStyle = "#fff"
				const xInterval = canvas.current.width / (points.length - 1)
				points.forEach((point, i) => {
					const height = canvas.current.height * 0.5 * Math.abs(point)
					const y = point > 0
						? canvas.current.height * 0.5 - height
						: canvas.current.height * 0.5
					ctx.fillRect(
						i * xInterval,
						y,
						xInterval,
						height
					)
				})
			})
		}
		draw()

		/** @param {MouseEvent} e */
		function changePoint(e) {
			const {offsetX, offsetY} = e
			const x = offsetX / canvas.current.width
			const y = (canvas.current.height / 2 - offsetY) / canvas.current.height * 2
			const index = Math.floor(x * (points.length - 1))
			points[index] = y
			dispatch('input')
			draw()
		}

		let grabbing = false
		canvas.current.addEventListener('mousedown', e => {
			grabbing = true
			changePoint(e)
		}, {passive: true, signal: controller.signal})

		canvas.current.addEventListener('mousemove', e => {
			if (!grabbing) return
			changePoint(e)
		}, {passive: true, signal: controller.signal})

		window.addEventListener('mouseup', () => {
			if (!grabbing) return
			grabbing = false
			dispatch('change')
		}, {passive: true, signal: controller.signal})

		return () => {
			controller.abort()
			cancelAnimationFrame(rafId)
		}
	}, [defaultValue, settings])

	return (
		<>
			<canvas ref={canvas} width="400" height="100" className={styles.main} />
			<input ref={input} id={id} name={name} className={styles.input} />
		</>
	)
}