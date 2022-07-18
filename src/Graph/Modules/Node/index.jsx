import classNames from 'classnames'
import { useContext, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { GraphAudioContext } from '../GraphAudioContext'
import Slot from './Slot'
import Setting from './Setting'
import Extra from './Extra'
import styles from './index.module.css'

export default function Node({
	Class,
	id,
	initialPosition,
	removeNode,
	handle,
}) {
	const audioContext = useContext(GraphAudioContext)
	const instance = useRef(/** @type {typeof Class?} */(null))
	const controls = useRef(/** @type {GainControls?} */({}))
	if (!instance.current) {
		instance.current = new Class(id, audioContext, controls, initialPosition)
	}
	useEffect(() => {
		return () => {
			instance.current.cleanup()
		}
	}, [])

	const ref = useRef(/** @type {HTMLDivElement} */(null))
	const header = useRef(/** @type {HTMLDivElement} */(null))

	// TODO: we don't need to have a "live" position since the canvas doesn't read it
	const position = useRef({...instance.current.data.dom})
	const staticPosition = useRef({...position.current})
	const slotsRef = useRef({})

	useImperativeHandle(handle, () => ({
		slots: slotsRef.current,
		connections: instance.current.data.connections,
	}))
	useEffect(() => {
		const controller = new AbortController()
		let dx = 0
		let dy = 0
		let initial
		let start
		let rafId
		header.current.addEventListener('mousedown', e => {
			if(e.button !== 0)
				return
			start = {x: e.clientX, y: e.clientY}
			initial = {...position.current}
			header.current.style.setProperty('cursor', 'grabbing')
		}, {signal: controller.signal})
		window.addEventListener('mousemove', e => {
			if(!start) return
			dx = e.clientX - start.x
			dy = e.clientY - start.y
			position.current.x = initial.x + dx
			position.current.y = initial.y + dy
			cancelAnimationFrame(rafId)
			rafId = requestAnimationFrame(() => {
				ref.current.style.setProperty(
					'transform',
					`translate(${dx}px, ${dy}px)`
				)
			})
		}, {signal: controller.signal})
		window.addEventListener('mouseup', () => {
			if (!start) return
			start = null
			cancelAnimationFrame(rafId)
			rafId = requestAnimationFrame(() => {
				ref.current.style.setProperty('--x', position.current.x)
				ref.current.style.setProperty('--y', position.current.y)
				ref.current.style.removeProperty('transform')
				header.current.style.removeProperty('cursor')
				staticPosition.current = {...position.current}
			})
			instance.current.data.dom = {...position.current}
			instance.current.saveToLocalStorage()
		}, {signal: controller.signal})
		return () => {
			controller.abort()
			cancelAnimationFrame(rafId)
		}
	}, [])

	const form = useRef(/** @type {HTMLFormElement} */(null))
	useEffect(() => {
		if (!Class.structure.settings?.length)
			return
		const controller = new AbortController()
		form.current.addEventListener('input', ({target}) => {
			const settingName = target.name
			const structure = Class.structure.settings.find(({name}) => name === settingName)
			if (!structure)
				return
			instance.current.data.settings[settingName] = target[structure.readFrom]
			if(instance.current.audioNode)
				instance.current.updateSetting(settingName)
			instance.current.saveToLocalStorage()
		}, {signal: controller.signal})
		return () => {
			controller.abort()
		}
	}, [Class])

	const onDelete = () => {
		instance.current.destroy()
		removeNode(id)
	}

	const [hover, setHover] = useState(false)
	return (
		<div
			className={classNames(styles.main, {
				[styles.hover]: hover
			})}
			ref={ref}
			style={{
				'--x': staticPosition.current.x,
				'--y': staticPosition.current.y,
			}}
		>
			<div className={styles.header}>
				<div
					className={styles.title}
					ref={header}
					onMouseEnter={() => setHover(true)}
					onMouseLeave={() => setHover(false)}
				>
					<img src={Class.image} width="1" height="1" alt=""/>
					{Class.type}
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
			<div
				className={styles.slots}
				style={{
					'--count': Class.structure.slots.length,
					'--outputs': Class.structure.slots.filter(({type}) => type === 'output').length,
				}}
			>
				{Class.structure.slots.map((slot) => {
					const slotId = `${id}.${slot.type}.${slot.name}`
					return (
						<Slot
							{...slot}
							key={slotId}
							left={slot.type !== 'output'}
							id={slotId}
							nodeId={id}
							// this method will leak memory if the # of slots in a Node can change
							ref={(element) => slotsRef.current[slotId] = element}
						/>
					)
				})}
			</div>
			<div className={styles.bottom}>
				{Class.structure.settings?.length > 0 && (
					<form
						ref={form}
						className={styles.settings}
					>
						{Class.structure.settings.map((setting, i) => (
							<Setting
								{...setting}
								key={setting.name}
								defaultValue={instance.current.data.settings[setting.name]}
								settings={instance.current.data.settings}
							/>
						))}
					</form>
				)}
				{Class.structure.extras?.length > 0 && (
					<>
						{Class.structure.extras.map((extra, i) => {
							const extraId = `${id}.extras.${extra.name}`
							return (
								<Extra
									{...extra}
									key={extraId}
									id={extraId}
									instance={instance}
								/>
							)
						})}
					</>
				)}
			</div>
		</div>
	)
}