import React, { useEffect, useRef, useState } from 'react'
import styles from './index.module.css'

export default function DynamicSelect({
	id,
	name,
	optionsFrom,
	instance,
	defaultValue,
}) {
	const [options, setOptions] = useState(() => instance.current[optionsFrom])
	const touched = useRef(false)
	const select = useRef(/** @type {HTMLSelectElement} */(null))

	useEffect(() => {
		const controller = new AbortController()
		
		instance.current.addEventListener(optionsFrom, () => {
			setOptions(instance.current[optionsFrom])
		}, {signal: controller.signal})

		return () => controller.abort()
	}, [instance, optionsFrom])

	useEffect(() => {
		if (touched.current) return
		const controller = new AbortController()
		select.current.addEventListener('change', () => {
			touched.current = true
		}, {signal: controller.signal, once: true})
		return () => controller.abort()
	}, [])

	useEffect(() => {
		if (touched.current) return
		if (options.some(({value}) => value === defaultValue)) {
			select.current.value = defaultValue
		}
	}, [defaultValue, options])

	return (
		<select
			ref={select}
			className={styles.main}
			name={name}
			id={id}
			disabled={options.length === 0}
			defaultValue={defaultValue}
		>
			<option key={null} value="">
				{options.length === 0 ? 'no MIDI device detected' : 'select device'}
			</option>
			{options.map(({value, label}) => (
				<option key={value} value={value}>{label}</option>
			))}
		</select>
	)
}