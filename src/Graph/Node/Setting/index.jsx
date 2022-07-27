import { useId } from "react"
import AutomationTrack from "./AutomationTrack"
import styles from "./index.module.css"
import Range from "./Range"
import Splice from "./Splice"
import TimeGrid from "./TimeGrid"
import Piano from "./Piano"
import FileInput from "./FileInput"
import KeyBound from "./KeyBound"
import ToggleRange from "./ToggleRange"
import WaveShaper from "./WaveShaper"
import Record from "./Record"

export default function Setting({name, type, defaultValue, options, props, settings, instance}) {
	const id = useId()
	if (type === 'track')
		return (
			<>
				<AutomationTrack {...props} id={id} name={name} defaultValue={defaultValue} settings={settings} instance={instance}/>
			</>
		)
	if (type === 'wave-shaper')
		return (
			<>
				<WaveShaper {...props} id={id} name={name} defaultValue={defaultValue} settings={settings} instance={instance}/>
			</>
		)
	if (type === 'splice')
		return (
			<>
				<Splice {...props} id={id} name={name} defaultValue={defaultValue} instance={instance}/>
			</>
		)
	if (type === 'timegrid')
		return (
			<>
				<TimeGrid {...props} id={id} name={name} defaultValue={defaultValue} instance={instance}/>
			</>
		)
	if (type === 'piano')
		return (
			<>
				<Piano {...props} id={id} name={name} defaultValue={defaultValue} />
			</>
		)
	if (type === 'select')
		return (
			<>
				<label htmlFor={id}>{name}</label>
				<select className={styles.select} name={name} {...props} defaultValue={defaultValue} id={id}>
					{options.map(option => (
						<option key={option} value={option}>{option}</option>
					))}
				</select>
				<div />
			</>
		)
	if (type === 'range')
		return (
			<>
				<label htmlFor={id}>{name}</label>
				<Range id={id} name={name} defaultValue={defaultValue} props={props} instance={instance}/>
			</>
		)
	if (type === 'toggle-range')
		return (
			<>
				<ToggleRange id={id} name={name} defaultValue={defaultValue} props={props}/>
			</>
		)
	if (type === 'file')
		return (
			<>
				<label htmlFor={id}>{name}</label>
				<FileInput name={name} {...props} id={id} defaultValue={defaultValue} />
			</>
		)
	if (type === 'key-bound')
		return (
			<>
				<KeyBound name={name} {...props} id={id} defaultValue={defaultValue} settings={settings}/>
			</>
		)
	if (type === 'record')
		return (
			<>
				<Record name={name} {...props} id={id} />
			</>
		)
	console.warn(`unknown Setting type ${type}`)
	return (
		<>
			<label htmlFor={id}>{name}</label>
			<input className={styles.default} type={type} name={name} defaultValue={defaultValue} {...props} id={id}/>
		</>
	)
}