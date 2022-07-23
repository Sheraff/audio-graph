import classNames from "classnames"
import { memo, useEffect, useRef, useState } from "react"
import styles from "./index.module.css"

const BLACK_KEYS = [1, 3, 6, 8, 10]

function Piano({id, name, size, defaultValue}){
	const buttons = useRef(/** @type {HTMLButtonElement[]} */([]))
	const input = useRef(/** @type {HTMLInputElement} */(null))
	const [initialValue, setInitialValue] = useState(defaultValue)
	const touched = useRef(false)

	useEffect(() => {
		if (!touched.current && Array.isArray(defaultValue))
			setInitialValue((former) => {
				if (former.length && !defaultValue.length)
					return former
				return defaultValue
			})
	}, [defaultValue])

	useEffect(() => {
		const controller = new AbortController()
		const piano = [...initialValue]

		Object.defineProperty(input.current, 'piano', {
			get: () => piano,
			configurable: true
		})

		function dispatch() {
			touched.current = true
			input.current.dispatchEvent(new Event("input", {bubbles: true}))
		}

		buttons.current.forEach((button, note) => {
			button.addEventListener('click', () => {
				if (piano.includes(note)) {
					piano.splice(piano.indexOf(note), 1)
					button.classList.remove(styles.active)
				} else {
					piano.push(note)
					button.classList.add(styles.active)
				}
				dispatch()
			}, {passive: true, signal: controller.signal})
		})

		return () => {
			controller.abort()
		}
	}, [size, initialValue])


	return (
		<>
			<div className={styles.main}>
				{Array(size).fill(0).map((_, note) => (
					<button
						key={note}
						type="button"
						className={classNames(styles.button, {
							[styles.active]: initialValue.includes(note),
							[styles.black]: BLACK_KEYS.includes(note % 12)
						})}
						ref={el => buttons.current[note] = el}
					/>
				))}
			</div>
			<input ref={input} id={id} name={name} className={styles.input} />
		</>
	)
}

export default memo(Piano)