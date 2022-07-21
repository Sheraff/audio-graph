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
		if(typeof audioContext === 'string') return

		let rafId
		let lastValue = -1
		function loop() {
			rafId = requestAnimationFrame(() => {
				loop()
				const step = instance.current.customNodes.timer.gain.value
				if (typeof step !== 'undefined' && step !== lastValue) {
					lastValue = step
					
					buttons.current.forEach((array, y) => {
						array.forEach((button, x) => {
							button.classList.toggle(styles.time, x === step)
						})
					})
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
			<input ref={input} id={id} name={name} className={styles.input} />
		</div>
	)
}

export default memo(TimeGrid)