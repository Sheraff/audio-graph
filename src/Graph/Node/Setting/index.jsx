import { useId } from "react"
import AutomationTrack from "../../../AutomationTrack"
import styles from "./index.module.css"

export default function Setting({name, type, defaultValue, value, options, props, params}) {
	const id = useId()
	if (type === 'track')
		return (
			<div className={styles.main}>
				<label htmlFor={id}>{name}</label>
				<AutomationTrack {...props} id={id} name={name} defaultValue={value ?? defaultValue} duration={params.duration}/>
			</div>
		)
	if (type === 'select')
		return (
			<div className={styles.main}>
				<label htmlFor={id}>{name}</label>
				<select name={name} {...props} defaultValue={value ?? defaultValue} id={id}>
					{options.map(option => (
						<option key={option} value={option}>{option}</option>
					))}
				</select>
			</div>
		)
	
	return (
		<div className={styles.main}>
			<label htmlFor={id}>{name}</label>
			<input type={type} name={name} defaultValue={value ?? defaultValue} {...props} id={id}/>
			<output className={styles.output} htmlFor={id}>{value}</output>
		</div>
	)
}