import { useEffect, useRef } from "react"
import styles from './index.module.css'

export default function FileInput({
	name,
	id,
	defaultValue,
	accept,
}) {
	const touched = useRef(false)
	const input = useRef(null)

	useEffect(() => {
		if (touched.current || !defaultValue) return

		const file = new File([], defaultValue, {})
		const container = new DataTransfer()
		container.items.add(file)
		input.current.files = container.files
	}, [defaultValue])

	return (
		<input
			ref={input}
			className={styles.main}
			type="file"
			name={name}
			accept={accept}
			id={id}
			onInput={() => touched.current = true}
		/>
	)
}