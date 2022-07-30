import styles from './index.module.css'

export default function Text({text}) {
	return (
		<p className={styles.main}>
			{text}
		</p>
	)
}