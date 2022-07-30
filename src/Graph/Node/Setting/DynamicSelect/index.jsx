import React, { useEffect, useState } from 'react'
import styles from '../index.module.css'

export default function DynamicSelect({
	id,
	name,
	optionsFrom,
	instance,
	defaultValue,
}) {
	const [options, setOptions] = useState(() => instance.current[optionsFrom])

	console.warn('as long as input is not touched, updating options should change the value to defaultValue if available')

	useEffect(() => {
		const controller = new AbortController()
		
		instance.current.addEventListener(optionsFrom, () => {
			setOptions(instance.current[optionsFrom])
		}, {signal: controller.signal})

		return () => controller.abort()
	}, [instance, optionsFrom])

	return (
		<select
			className={styles.select}
			name={name}
			id={id}
			disabled={options.length === 0}
			defaultValue={defaultValue}
		>
			<option key={null} value="">---</option>
			{options.map(({value, label}) => (
				<option key={value} value={value}>{label}</option>
			))}
		</select>
	)
}