import React, { useCallback, useEffect, useRef } from 'react'
import useAudioParamViz from '../utils/useAudioParamViz'
import styles from './index.module.css'

export default function Range({id, name, defaultValue, props, instance}){
	const range = useRef(null)
	const text = useRef(null)
	const touched = useRef(false)
	useEffect(() => {
		if(touched.current) return
		text.current.value = defaultValue
		range.current.value = defaultValue
	}, [defaultValue])

	const ref = useRef(null)
	const callback = useCallback((base, value) => {
		ref.current.style.setProperty('--base', base)
		ref.current.style.setProperty('--value', value)
	}, [])
	useAudioParamViz({instance, name, props, callback})

	return (
		<>
			<div ref={ref} className={styles.main} style={{'--base': 0, '--value': 0}}>
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
			</div>
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