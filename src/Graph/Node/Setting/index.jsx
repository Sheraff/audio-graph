import { useId } from "react"
import AutomationTrack from "./AutomationTrack"
import styles from "./index.module.css"
import Range from "./Range"
import Splice from "./Splice"
import TimeGrid from "./TimeGrid"
import Piano from "./Piano"
import FileInput from "./FileInput"

export default function Setting({name, type, defaultValue, options, props, settings, instance}) {
	const id = useId()
	if (type === 'track')
		return (
			<div className={styles.main}>
				<label htmlFor={id}>{name}</label>
				<AutomationTrack {...props} id={id} name={name} defaultValue={defaultValue} settings={settings}/>
				<div />
			</div>
		)
	if (type === 'splice')
		return (
			<div className={styles.main}>
				<label htmlFor={id}>{name}</label>
				<Splice {...props} id={id} name={name} defaultValue={defaultValue} instance={instance}/>
				<div />
			</div>
		)
	if (type === 'timegrid')
		return (
			<div className={styles.main}>
				<label htmlFor={id}>{name}</label>
				<TimeGrid {...props} id={id} name={name} defaultValue={defaultValue} instance={instance}/>
				<div />
			</div>
		)
	if (type === 'piano')
		return (
			<div className={styles.main}>
				<label htmlFor={id}>{name}</label>
				<Piano {...props} id={id} name={name} defaultValue={defaultValue} />
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
	if (type === 'file')
		return (
			<div className={styles.main}>
				<label htmlFor={id}>{name}</label>
				<FileInput name={name} {...props} id={id} defaultValue={defaultValue} settings={settings}/>
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