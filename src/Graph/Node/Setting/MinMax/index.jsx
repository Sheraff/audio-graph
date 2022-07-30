import classNames from 'classnames'
import React, { useEffect, useRef, memo, useCallback } from 'react'
import useAudioParamViz from '../utils/useAudioParamViz'
import styles from './index.module.css'

function MinMax({name, defaultValue, props, controls, instance}){
	const mainRef = useRef(/** @type {HTMLDivElement} */(null))
	const inputRef = useRef(/** @type {HTMLInputElement} */(null))
	const minInputRef = useRef(/** @type {HTMLInputElement} */(null))
	const maxInputRef = useRef(/** @type {HTMLInputElement} */(null))
	const trackRef = useRef(/** @type {HTMLDivElement} */(null))
	const minRef = useRef(/** @type {HTMLDivElement} */(null))
	const maxRef = useRef(/** @type {HTMLDivElement} */(null))

	useEffect(() => {
		const controller = new AbortController()
		const delta = props.max - props.min
		let values = [defaultValue[0], defaultValue[1]]

		const assignValue = (index, value) => {
			if (index === 0 && value === values[1]) {
				if (value < props.min + props.step) {
					values[0] = props.min
					values[1] = props.min + props.step
				} else {
					values[0] = values[1] - props.step
				}
			} else if (index === 1 && value === values[0]) {
				if (value > props.max - props.step) {
					values[1] = props.max
					values[0] = props.max - props.step
				} else {
					values[1] = values[0] + props.step
				}
			} else {
				values[index] = value
			}
		}

		const updateDisplay = () => {
			mainRef.current.style.setProperty('--min', (values[0] - props.min) / delta)
			mainRef.current.style.setProperty('--max', (values[1] - props.min) / delta)
			minInputRef.current.value = values[0]
			maxInputRef.current.value = values[1]
			minInputRef.current.setAttribute('max', values[1])
			maxInputRef.current.setAttribute('min', values[0])
		}
		updateDisplay()

		Object.defineProperty(inputRef.current, 'values', {
			get: () => [...values],
			configurable: true,
		})

		const decimals = props.step.toString().split('.')[1]?.length || 0

		const eventToValue = (event) => {
			const {clientX} = event
			const {left, width} = mainRef.current.getBoundingClientRect()
			const x = clientX - left
			const value = Math.min(props.max, Math.max(props.min, x / width * delta + props.min))
			const clampedToStep = Math.round(value / props.step) * props.step
			return Number(clampedToStep.toFixed(decimals))
		}

		/** @type {null | HTMLDivElement} */
		let grabbing = null

		minRef.current.addEventListener('mousedown', (event) => {
			grabbing = event.target
		}, {signal: controller.signal})
		maxRef.current.addEventListener('mousedown', (event) => {
			grabbing = event.target
		}, {signal: controller.signal})

		const processValue = (value) => {
			const valueIndex = grabbing === minRef.current ? 0 : 1
			if (values[valueIndex] !== value) {
				assignValue(valueIndex, value)
				updateDisplay()
				inputRef.current.dispatchEvent(new Event('input', {bubbles: true}))
			}
		}

		trackRef.current.addEventListener('mousedown', (event) => {
			const value = eventToValue(event)
			if (Math.abs(value - values[0]) < Math.abs(value - values[1])) {
				grabbing = minRef.current
			} else {
				grabbing = maxRef.current
			}
			processValue(value)
		}, {signal: controller.signal})

		window.addEventListener('mousemove', (event) => {
			if(!grabbing) return

			let value = eventToValue(event)
			if (grabbing === minRef.current && value > values[1]) value = values[1]
			if (grabbing === maxRef.current && value < values[0]) value = values[0]
			processValue(value)
		}, {signal: controller.signal})

		window.addEventListener('mouseup', (e) => {
			if(!grabbing) return
			grabbing = null
			inputRef.current.dispatchEvent(new Event('change', {bubbles: true}))
		}, {signal: controller.signal})

		const onKeyChange = (index, value) => {
			if (values[index] !== value) {
				assignValue(index, value)
				updateDisplay()
				inputRef.current.dispatchEvent(new Event('input', {bubbles: true}))
				inputRef.current.dispatchEvent(new Event('change', {bubbles: true}))
			}
		}

		minRef.current.addEventListener('keydown', (event) => {
			if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
				const value = Math.max(props.min, values[0] - props.step)
				onKeyChange(0, value)
				event.preventDefault()
			} else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
				const value = Math.min(values[1], values[0] + props.step)
				onKeyChange(0, value)
				event.preventDefault()
			}
		}, {signal: controller.signal})
		maxRef.current.addEventListener('keydown', (event) => {
			if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
				const value = Math.max(values[0], values[1] - props.step)
				onKeyChange(1, value)
				event.preventDefault()
			} else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
				const value = Math.min(props.max, values[1] + props.step)
				onKeyChange(1, value)
				event.preventDefault()
			}
		}, {signal: controller.signal})

		function numberInputEvent(element, type, index) {
			element.addEventListener(type, (event) => {
				assignValue(index, event.target.value)
				updateDisplay()
				inputRef.current.dispatchEvent(new Event(type, {bubbles: true}))
			}, {signal: controller.signal})
		}
		numberInputEvent(minInputRef.current, 'input', 0)
		numberInputEvent(minInputRef.current, 'change', 0)
		numberInputEvent(maxInputRef.current, 'input', 1)
		numberInputEvent(maxInputRef.current, 'change', 1)

		return () => controller.abort()
	}, [
		props.min,
		props.max,
		props.step,
		defaultValue[0],
		defaultValue[1],
	])

	/* eslint-disable react-hooks/rules-of-hooks -- trying to optimize perf */
	if (controls?.min) {
		const callback = useCallback((base, value) => {
			mainRef.current.style.setProperty('--min-base', base)
			mainRef.current.style.setProperty('--min-value', value)
		}, [])
		useAudioParamViz({instance, name: controls.min, props, callback})
	}
	if (controls?.max) {
		const callback = useCallback((base, value) => {
			mainRef.current.style.setProperty('--max-base', base)
			mainRef.current.style.setProperty('--max-value', value)
		}, [])
		useAudioParamViz({instance, name: controls.max, props, callback})
	}
	/* eslint-enable react-hooks/rules-of-hooks -- trying to optimize perf */

	return (
		<>
			<span className={styles.main} ref={mainRef} style={{
				'--min': (defaultValue[0] - props.min) / (props.max - props.min),
				'--max': (defaultValue[1] - props.min) / (props.max - props.min),
				'--min-base': 0,
				'--min-value': 0,
				'--max-base': 0,
				'--max-value': 0,
			}}>
				<input className={styles.input} ref={inputRef} name={name} />
				<span ref={minRef} className={classNames(styles.thumb, styles.min)} tabIndex={0} />
				<span ref={maxRef} className={classNames(styles.thumb, styles.max)} tabIndex={0} />
				<span ref={trackRef} className={styles.track}/>
			</span>
			<span>
				<input
					ref={minInputRef}
					type="number"
					className={styles.text}
					step={props.step}
					min={props.min}
					max={props.max}
					defaultValue={defaultValue[0]}
				/>
				:
				<input
					ref={maxInputRef}
					type="number"
					className={styles.text}
					step={props.step}
					min={props.min}
					max={props.max}
					defaultValue={defaultValue[1]}
				/>
			</span>
		</>
	)
}

export default memo(MinMax)