import { useEffect, useRef } from 'react'
import styles from './index.module.css'

export default function Range({id, name, defaultValue, props}){
	const range = useRef(null)
	const text = useRef(null)
	const touched = useRef(false)
	useEffect(() => {
		if(touched.current) return
		text.current.value = defaultValue
		range.current.value = defaultValue
	}, [defaultValue])
	return (
		<>
			<input
				ref={range}
				onChange={() => {
					touched.current = true
					text.current.value = range.current.value
				}}
				type="range"
				name={name}
				defaultValue={defaultValue}
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
				defaultValue={defaultValue}
				className={styles.text}
			/>
		</>
	)
}