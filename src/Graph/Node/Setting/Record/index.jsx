import styles from './index.module.css'

export default function Record({name, id}) {
	return (
		<>
			<input id={id} name={name} type="checkbox" className={styles.input} />
			<label htmlFor={id} className={styles.main}>
				<span className={styles.status}/>
				<span className={styles.label}>rec</span>
			</label>
		</>
	)
}