import classNames from 'classnames'
import { useEffect, useRef, memo } from 'react'
import styles from './index.module.css'

function MinMax({name, defaultValue, props, instance}){
	const mainRef = useRef(/** @type {HTMLDivElement} */(null))
	const inputRef = useRef(/** @type {HTMLInput} */(null))
	const trackRef = useRef(/** @type {HTMLDivElement} */(null))
	const minRef = useRef(/** @type {HTMLDivElement} */(null))
	const maxRef = useRef(/** @type {HTMLDivElement} */(null))
	console.log('------ rerender')

	useEffect(() => {
		const controller = new AbortController()
		const delta = props.max - props.min
		let values = [defaultValue[0], defaultValue[1]]

		const updateDisplay = () => {
			mainRef.current.style.setProperty('--min', (values[0] - props.min) / delta)
			mainRef.current.style.setProperty('--max', (values[1] - props.min) / delta)
		}
		updateDisplay()

		Object.defineProperty(inputRef.current, 'values', {
			get: () => values,
			set: (v) => {
				values = v
				updateDisplay()
			},
			configurable: true,
		})

		const eventToValue = (event) => {
			const {clientX} = event
			const {left, width} = mainRef.current.getBoundingClientRect()
			const x = clientX - left
			return Math.min(props.max, Math.max(props.min, x / width * delta + props.min))
		}

		let grabbing = false
		minRef.current.addEventListener('mousedown', (event) => {
			grabbing = event.target
		}, {signal: controller.signal})
		maxRef.current.addEventListener('mousedown', (event) => {
			grabbing = event.target
		}, {signal: controller.signal})
		trackRef.current.addEventListener('mousedown', (event) => {
			const value = eventToValue(event)
			if (Math.abs(value - values[0]) < Math.abs(value - values[1])) {
				grabbing = minRef.current
			} else {
				grabbing = maxRef.current
			}
			values[grabbing === minRef.current ? 0 : 1] = value
			updateDisplay()
			inputRef.current.dispatchEvent(new Event('input'))
		}, {signal: controller.signal})

		window.addEventListener('mousemove', (event) => {
			if(!grabbing) return

			let value = eventToValue(event)
			if (grabbing === minRef.current && value > values[1]) value = values[1]
			if (grabbing === maxRef.current && value < values[0]) value = values[0]
			values[grabbing === minRef.current ? 0 : 1] = value
			updateDisplay()
			inputRef.current.dispatchEvent(new Event('input'))
		}, {signal: controller.signal})

		window.addEventListener('mouseup', (e) => {
			if(!grabbing) return
			grabbing = false
			inputRef.current.dispatchEvent(new Event('change'))
		}, {signal: controller.signal})

		minRef.current.addEventListener('keydown', (event) => {
			if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
				values[0] = Math.max(props.min, values[0] - props.step)
				updateDisplay()
				event.preventDefault()
				inputRef.current.dispatchEvent(new Event('change'))
				inputRef.current.dispatchEvent(new Event('input'))
			}
			if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
				values[0] = Math.min(values[1], values[0] + props.step)
				updateDisplay()
				event.preventDefault()
				inputRef.current.dispatchEvent(new Event('change'))
				inputRef.current.dispatchEvent(new Event('input'))
			}
		}, {signal: controller.signal})
		maxRef.current.addEventListener('keydown', (event) => {
			if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
				values[1] = Math.max(values[0], values[1] - props.step)
				updateDisplay()
				event.preventDefault()
				inputRef.current.dispatchEvent(new Event('change'))
				inputRef.current.dispatchEvent(new Event('input'))
			}
			if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
				values[1] = Math.min(props.max, values[1] + props.step)
				updateDisplay()
				event.preventDefault()
				inputRef.current.dispatchEvent(new Event('change'))
				inputRef.current.dispatchEvent(new Event('input'))
			}
		}, {signal: controller.signal})

		return () => controller.abort()
	}, [props.min, props.max, props.step, defaultValue[0], defaultValue[1]])

	return (
		<>
			<span className={styles.main} ref={mainRef}>
				<input className={styles.input} ref={inputRef} name={name} />
				<span ref={minRef} className={classNames(styles.thumb, styles.min)} tabIndex="0" />
				<span ref={maxRef} className={classNames(styles.thumb, styles.max)} tabIndex="0" />
				<span ref={trackRef} className={styles.track}/>
			</span>
		</>
	)
}

export default memo(MinMax)