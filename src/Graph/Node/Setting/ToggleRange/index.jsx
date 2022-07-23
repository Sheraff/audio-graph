import { useEffect, useId, useRef } from "react"
import styles from './index.module.css'

export default function ToggleRange({
	id,
	name,
	defaultValue = {},
	props,
}) {
	const toggle = useRef(null)
	const range = useRef(null)
	const text = useRef(null)
	const touched = useRef(false)
	useEffect(() => {
		if(touched.current) return
		text.current.value = defaultValue.value
		text.current.disabled = !defaultValue.enabled
		range.current.value = defaultValue.value
		range.current.disabled = !defaultValue.enabled
		toggle.current.checked = defaultValue.enabled
	}, [defaultValue])

	useEffect(() => {
		Object.defineProperty(range.current, 'toggle-value', {
			get: () => ({
				value: Number(range.current.value),
				enabled: toggle.current.checked,
			}),
		})
	}, [])

	const toggleId = useId()
	return (
		<>
			<span>
				<input
					type="checkbox"
					ref={toggle}
					id={toggleId}
					aria-controls={id}
					defaultValue={defaultValue.enabled}
					onChange={() => {
						touched.current = true
						range.current.disabled = !toggle.current.checked
						text.current.disabled = !toggle.current.checked
						range.current.dispatchEvent(new Event('input', {bubbles: true}))
					}}
				/>
				<label htmlFor={toggleId}>{name}</label>
			</span>
			<input
				ref={range}
				onChange={() => {
					touched.current = true
					text.current.value = range.current.value
				}}
				type="range"
				name={name}
				defaultValue={defaultValue.value}
				disabled={!defaultValue.enabled}
				{...props}
				id={id}
				className={styles.range}
			/>
			<input
				ref={text}
				onChange={() => {
					touched.current = true
					range.current.value = Number(text.current.value)
					range.current.dispatchEvent(new Event('input', {bubbles: true}))
				}}
				type="number"
				{...props}
				htmlFor={id}
				defaultValue={defaultValue.value}
				disabled={!defaultValue.enabled}
				className={styles.text}
			/>
		</>
	)
}