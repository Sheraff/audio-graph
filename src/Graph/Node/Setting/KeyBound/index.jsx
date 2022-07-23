import { useEffect, useRef, useState } from "react"
import styles from './index.module.css'

export default function KeyBound({
	name,
	id,
	defaultValue,
	settings,
	...props
}) {
	const range = useRef(null)
	const text = useRef(null)

	const boundValue = useRef({...defaultValue})

	const [key, setKey] = useState(defaultValue.key)
	useEffect(() => {
		Object.defineProperty(range.current, 'binding', {
			get: () => boundValue.current,
		})

		const controller = new AbortController()
		text.current.addEventListener('keydown', (event) => {
			if (/^[a-z]$/.test(event.key)) {
				event.preventDefault()
				setKey(event.key)
				boundValue.current.key = event.key
				text.current.blur()
				range.current.dispatchEvent(new Event("input", {bubbles: true}))
			}
		}, {signal: controller.signal})
		return () => controller.abort()
	}, [])

	useEffect(() => {
		const controller = new AbortController()
		let held = false
		let start
		window.addEventListener('keydown', (event) => {
			if (event.key === key) {
				event.preventDefault()
				held = true
			}
		}, {signal: controller.signal})
		window.addEventListener('keyup', (event) => {
			if (event.key === key) {
				event.preventDefault()
				held = false
				start = null
			}
		}, {signal: controller.signal})
		window.addEventListener('mousemove', (event) => {
			if (!held) return
			if (!start) {
				start = event.clientY
				return
			}
			event.preventDefault()
			const dy = (start - event.clientY) / (window.innerHeight) * (props.max - props.min)
			start = event.clientY
			boundValue.current.value = Math.max(props.min, Math.min(props.max, dy + boundValue.current.value))
			range.current.dispatchEvent(new Event("input", {bubbles: true}))
			range.current.value = boundValue.current.value
		}, {signal: controller.signal})
		return () => controller.abort()
	}, [key, props.max, props.min])

	return (
		<>
			<p className={styles.explain}>
				hold the key down while moving the mouse
			</p>
			<label htmlFor={id}>{name}</label>
			<input
				{...props}
				ref={range}
				className={styles.main}
				type="range"
				disabled
				name={name}
				id={id}
				defaultValue={defaultValue.value}
			/>
			<input
				ref={text}
				type="text"
				pattern="[a-z]"
				value={key.toUpperCase()}
				onChange={() => {}} // STFU React
				size={1}
			/>
		</>
	)
}