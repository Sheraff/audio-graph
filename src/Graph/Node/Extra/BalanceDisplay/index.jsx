import { useContext, useEffect, useRef } from "react"
import { GraphAudioContext } from '../../../GraphAudioContext'
import styles from "./index.module.css"

export default function BalanceDisplay({instance}) {
	const canvas = useRef(/** @type {HTMLCanvasElement} */(null))
	const audioContext = useContext(GraphAudioContext)

	useEffect(() => {
		if(typeof audioContext === 'string') return
		const ctx = canvas.current.getContext("2d")
		if(!ctx) return
		canvas.current.width = canvas.current.offsetWidth
		canvas.current.height = canvas.current.offsetHeight

		let array = {}
		let bufferLength = {}
		function makeBuffer(key) {
			bufferLength[key] = instance.current.customNodes[key].frequencyBinCount
			array[key] = new Float32Array(bufferLength[key])
		}

		if (instance.current.customNodes.left) {
			makeBuffer('left')
			makeBuffer('right')
		} else {
			instance.current.onAudioNode = () => {
				makeBuffer('left')
				makeBuffer('right')
			}
		}

		const SECTIONS = 30
		const BAR_WIDTH = ctx.canvas.width / 5
		const freeSpace = ctx.canvas.width - BAR_WIDTH * 2
		const verticalSpacing = 2
		const sectionHeight = (ctx.canvas.height - (SECTIONS - 1) * verticalSpacing) / SECTIONS

		const r = 129
		const g = 31
		const b = 249
		const dr = 255 - r
		const dg = 255 - g
		const db = 255 - b

		const path = new Path2D()
		path.moveTo(0, canvas.current.height * 0.25)
		path.lineTo(canvas.current.width, canvas.current.height * 0.25)
		path.moveTo(0, canvas.current.height * 0.5)
		path.lineTo(canvas.current.width, canvas.current.height * 0.5)
		path.moveTo(0, canvas.current.height * 0.75)
		path.lineTo(canvas.current.width, canvas.current.height * 0.75)

		let rafId
		function loop() {
			rafId = requestAnimationFrame(() => {
				loop()
				if(!array.left || !array.right)
					return
				if (instance.current.customNodes.left.frequencyBinCount !== bufferLength.left)
					makeBuffer('left')
				if (instance.current.customNodes.right.frequencyBinCount !== bufferLength.right)
					makeBuffer('right')

				instance.current.customNodes.left.getFloatTimeDomainData(array.left)
				instance.current.customNodes.right.getFloatTimeDomainData(array.right)
				const avgLeft = array.left.reduce((max, v) => Math.max(max, Math.abs(v)), 0)
				const avgRight = array.right.reduce((max, v) => Math.max(max, Math.abs(v)), 0)
				
				ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
				
				ctx.strokeStyle = "#fff2"
				ctx.stroke(path)
				
				for (let index = 0; index < SECTIONS; index++) {
					const p = index / SECTIONS
					ctx.fillStyle = `rgb(${255 - p*dr}, ${255 - p*dg}, ${255 - p*db})`
					if (avgLeft > index / SECTIONS) {
						ctx.fillRect(
							freeSpace / 3,
							ctx.canvas.height - (index + 1) * sectionHeight - (index * verticalSpacing),
							BAR_WIDTH,
							sectionHeight,
						)
					}
					if (avgRight > index / SECTIONS) {
						ctx.fillRect(
							2 * freeSpace / 3 + BAR_WIDTH,
							ctx.canvas.height - (index + 1) * sectionHeight - (index * verticalSpacing),
							BAR_WIDTH,
							sectionHeight,
						)
					}
				}
			})
		}

		const controller = new AbortController()
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