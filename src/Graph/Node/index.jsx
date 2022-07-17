import classNames from "classnames"
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import { flushSync } from "react-dom"
import styles from './index.module.css'
import Setting from "./Setting"
import Slot from "./Slot"
import TYPES from "./Types"

function Node({
	id,
	x,
	y,
	type,
	setSelf,
	deleteSelf,
	onSettings,
}, ref) {
	const { inputs = [], outputs = [], settings = [] } = TYPES[type]
	const slotsRef = useRef({})

	const main = useRef(/** @type {HTMLDivElement} */(null))
	const header = useRef(/** @type {HTMLDivElement} */(null))
	useEffect(() => {
		const controller = new AbortController()
		let start, end, rafId
		header.current.addEventListener('mousedown', e => {
			start = { x: e.clientX, y: e.clientY }
			header.current.style.setProperty('cursor', 'grabbing')
		}, {signal: controller.signal})
		window.addEventListener('mousemove', e => {
			if (!start) return
			end = {
				dx: e.clientX - start.x,
				dy: e.clientY - start.y,
			}
			cancelAnimationFrame(rafId)
			rafId = requestAnimationFrame(() => {
				main.current.style.setProperty('transform', `translate(${end.dx}px, ${end.dy}px)`)
			})
		}, {signal: controller.signal})
		window.addEventListener('mouseup', e => {
			if (!start) return
			start = null
			cancelAnimationFrame(rafId)
			rafId = requestAnimationFrame(() => {
				flushSync(() => {
					setSelf((prev) => ({
						...prev,
						x: prev.x + end.dx,
						y: prev.y + end.dy,
					}))
				})
				main.current.style.removeProperty('transform')
				header.current.style.removeProperty('cursor')
			})
		}, {signal: controller.signal})
		return () => {
			controller.abort()
			cancelAnimationFrame(rafId)
		}
	}, [setSelf])

	const [params, setParams] = useState(() => {
		const storedParams = localStorage.getItem(`node-${id}-${type}`)
		if (storedParams) {
			return JSON.parse(storedParams)
		}
		return Object.fromEntries(
			settings.map(({ name, defaultValue }) => [name, defaultValue])
		)
	})
	const form = useRef(/** @type {HTMLFormElement} */(null))
	useEffect(() => {
		const controller = new AbortController()
		form.current.addEventListener('input', e => {
			setParams(Object.fromEntries(
				settings.map(
					({name, readFrom}) => [name, form.current.elements[name][readFrom]]
				)
			))
		}, {signal: controller.signal})
		return () => {
			controller.abort()
		}
	}, [settings])

	useImperativeHandle(ref, () => ({
		id,
		type,
		slots: slotsRef.current,
		settings: params,
	}))

	useEffect(() => {
		onSettings()
		const ricID = requestIdleCallback(() => {
			localStorage.setItem(`node-${id}-${type}`, JSON.stringify(params))
		})
		return () => {
			cancelIdleCallback(ricID)
		}
	}, [params, id, type])

	const onDelete = () => {
		deleteSelf()
		localStorage.removeItem(`node-${id}-${type}`)
	}

	const [hover, setHover] = useState(false)
	return (
		<div
			className={classNames(styles.main, {
				[styles.hover]: hover
			})}
			ref={main}
			style={{
				'--x': `${x}px`,
				'--y': `${y}px`,
				'--left': inputs.length,
				'--right': outputs.length,
			}}
		>
			<div className={styles.header}>
				<div
					className={styles.title}
					ref={header}
					onMouseEnter={() => setHover(true)}
					onMouseLeave={() => setHover(false)}
				>
					<img src={`${process.env.PUBLIC_URL}/icons/${type}.svg`} width="1" height="1" alt=""/>
					{type}
				</div>
				<button
					type="button"
					className={styles.delete}
					onClick={onDelete}
					aria-label="delete"
				>
					✖
				</button>
			</div>
			<div className={styles.input}>
				{inputs.map((slot, i) => {
					const slotId = `${id}.inputs.${i}`
					return (
						<Slot key={i} {...slot} left id={slotId} ref={element => slotsRef.current[slotId] = element}/>
					)
				})}
			</div>
			<div className={styles.output}>
				{outputs.map((slot, i) => {
					const slotId = `${id}.outputs.${i}`
					return (
						<Slot key={i} {...slot} right id={slotId} ref={element => slotsRef.current[slotId] = element}/>
					)
				})}
			</div>
			<form className={styles.settings} ref={form}>
				{settings.map((setting, i) => (
					<Setting key={i} value={params[setting.name]} {...setting}/>
				))}
			</form>
		</div>
	)
}

export default forwardRef(Node)