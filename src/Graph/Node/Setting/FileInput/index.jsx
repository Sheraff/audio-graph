import { useEffect, useRef } from "react"

export default function FileInput({
	name,
	id,
	defaultValue,
	accept,
	settings,
}) {
	const touched = useRef(false)
	const input = useRef(null)

	useEffect(() => {
		if (touched.current || !defaultValue) return

		const file = new File(settings.buffer, defaultValue, {})
		const container = new DataTransfer()
		container.items.add(file)
		input.current.files = container.files
	}, [defaultValue])

	return (
		<input ref={input} type="file" name={name} accept={accept} id={id} onInput={() => touched.current = true} />
	)
}