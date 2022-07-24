import classNames from "classnames"
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react"
import styles from './index.module.css'

export default forwardRef(function Slot({
	type,
	name,
	left,
	id,
	nodeId,
}: {
	
}, ref) {
	const slot = useRef<HTMLDivElement>(null)
	useImperativeHandle(ref, () => ({
		element: slot.current,
		input: left,
		id,
		nodeId,
		name,
		type,
	}))
	
	useEffect(() => {
		const controller = new AbortController()
		let canStart = false
		
		slot.current?.addEventListener('mousedown', e => {
			canStart = true
		}, {signal: controller.signal})

		slot.current?.addEventListener('mouseleave', () => {
			if(!canStart) return
			canStart = false
			const event = new CustomEvent('slot-down', {
				bubbles: true,
				detail: { id, type, left, nodeId, name }
			})
			slot.current?.dispatchEvent(event)
		})
		
		slot.current?.addEventListener('mouseup', e => {
			canStart = false
			const event = new CustomEvent('slot-up', {
				bubbles: true,
				detail: { id, type, left, nodeId, name }
			})
			slot.current?.dispatchEvent(event)
		}, {signal: controller.signal})
		
		return () => {
			controller.abort()
		}
	}, [id, type, left, nodeId, name])

	return (
		<div ref={slot} className={classNames(styles.main, {
			[styles.left]: left,
			[styles.right]: !left,
		})}>
			{typeof name === 'string' ? name : type}
		</div>
	)
})