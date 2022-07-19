import classNames from "classnames"
import { memo, useContext, useEffect, useRef, useState } from "react"
import { GraphAudioContext } from "../../../GraphAudioContext"
import styles from "./index.module.css"

function TimeGrid({id, name, size, defaultValue, instance}){
	const buttons = useRef(/** @type {HTMLButtonElement[][]} */([]))
	const input = useRef(/** @type {HTMLInputElement} */(null))
	const [initialValue, setInitialValue] = useState(defaultValue)
	const touched = useRef(false)

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
		const controller = new AbortController()
		const sequence = Array(size[1]).fill(0).map((_, y) => ([...initialValue[y]]))

		Object.defineProperty(input.current, 'sequence', {
			get() {
				return sequence
			},
			configurable: true
		})

		function dispatch() {
			touched.current = true
			input.current.dispatchEvent(new Event("input", {bubbles: true}))
		}

		buttons.current.forEach((array, y) => {
			array.forEach((button, x) => {
				button.addEventListener('click', () => {
					sequence[y][x] = sequence[y][x] ? 0 : 1
					button.classList.toggle(styles.active, sequence[y][x] === 1)
					dispatch()
				}, {passive: true, signal: controller.signal})
			})
		})

		return () => {
			controller.abort()
		}
	}, [size, initialValue])

	useEffect(() => {
		
		let rafId

		let array
		let bufferLength
		function makeBuffer() {
			bufferLength = instance.current.customNodes.timeAnalyser.frequencyBinCount
			array = new Float32Array(bufferLength)
		}

		if (instance.current.customNodes.timeAnalyser) {
			makeBuffer()
		} else {
			instance.current.onAudioNode = () => {
				makeBuffer()
			}
		}

		function loop() {
			rafId = requestAnimationFrame(() => {
				loop()
				if(!array)
					return
				if (instance.current.customNodes.timeAnalyser.frequencyBinCount !== bufferLength)
					makeBuffer()

				instance.current.customNodes.timeAnalyser.getFloatTimeDomainData(array)

				const sum = array.reduce((sum, value) => sum + value, 0)
				const step = Math.round(sum / (array.length / size[1]))
				
				buttons.current.forEach((array, y) => {
					array.forEach((button, x) => {
						button.classList.toggle(styles.time, x === step)
					})
				})
			})
		}
		loop()

		return () => {
			cancelAnimationFrame(rafId)
		}
	}, [initialValue, audioContext, instance, size])

	return (
		<div>
			<div className={styles.main} style={{'--col': size[0]}}>
				{Array(size[1]).fill(0).map((_, y) => (
					Array(size[0]).fill(0).map((__, x) => (
						<button
							key={`${x}-${y}`}
							type="button"
							data-x={x}
							data-y={y}
							className={classNames(styles.button, {
								[styles.active]: initialValue[y][x] === 1
							})}
							ref={el => {
								if(!buttons.current[y])
									buttons.current[y] = []
								buttons.current[y][x] = el
							}}
						/>
					))
				))}
			</div>
			<input ref={input} id={id} name={name} className={styles.input} defaultValue={''} />
		</div>
	)
}

export default memo(TimeGrid)