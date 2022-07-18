import { useId } from "react"
import AutomationTrack from "./AutomationTrack"
import styles from "./index.module.css"
import Range from "./Range"

export default function Setting({name, type, defaultValue, options, props, params}) {
	const id = useId()
	if (type === 'track')
		return (
			<div className={styles.main}>
				<label htmlFor={id}>{name}</label>
				<AutomationTrack {...props} id={id} name={name} defaultValue={defaultValue} duration={params.duration}/>
				<div />
			</div>
		)
	if (type === 'select')
		return (
			<div className={styles.main}>
				<label htmlFor={id}>{name}</label>
				<select name={name} {...props} defaultValue={defaultValue} id={id}>
					{options.map(option => (
						<option key={option} value={option}>{option}</option>
					))}
				</select>
			</div>
		)
	if (type === 'range')
		return (
			<div className={styles.main}>
				<label htmlFor={id}>{name}</label>
				<Range id={id} name={name} defaultValue={defaultValue} props={props} />
			</div>
		)
	
	console.warn(`unknown Setting type ${type}`)
	return (
		<div className={styles.main}>
			<label htmlFor={id}>{name}</label>
			<input type={type} name={name} defaultValue={defaultValue} {...props} id={id}/>
		</div>
	)
}