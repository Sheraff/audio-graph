import classNames from "classnames"
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react"
import styles from './index.module.css'

function Slot({name, left, right, id}, ref) {
	const slot = useRef(/** @type {HTMLDivElement} */(null))
	useImperativeHandle(ref, () => ({
		element: slot.current,
		type: left ? 'input' : 'output',
		name,
	}))
	useEffect(() => {
		const controller = new AbortController()
		slot.current.addEventListener('mousedown', e => {
			const event = new CustomEvent('slot-down', {
				bubbles: true,
				detail: {
					id,
					type: left ? 'to' : 'from',
				}
			})
			slot.current.dispatchEvent(event)
		}, {signal: controller.signal})
		slot.current.addEventListener('mouseup', e => {
			const event = new CustomEvent('slot-up', {
				bubbles: true,
				detail: {
					id,
					type: left ? 'to' : 'from',
				}
			})
			slot.current.dispatchEvent(event)
		}, {signal: controller.signal})
		return () => {
			controller.abort()
		}
	}, [id, left])
	return (
		<div ref={slot} className={classNames(styles.main, {
			[styles.left]: left,
			[styles.right]: right,
		})}>
			{name}
		</div>
	)
}

export default forwardRef(Slot)