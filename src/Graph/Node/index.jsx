import classNames from 'classnames'
import { memo, useContext, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { GraphAudioContext } from '../GraphAudioContext'
import Slot from './Slot'
import Setting from './Setting'
import Extra from './Extra'
import styles from './index.module.css'

function getIn(obj, path) {
	return path.split('.').reduce((o, i) => o[i], obj)
}

function Node({
	Class,
	id,
	initialPosition,
	startHeld,
	removeNode,
	handle,
	boundary,
}) {
	const audioContext = useContext(GraphAudioContext)
	const instance = useRef(/** @type {typeof Class?} */(null))
	if (!instance.current) {
		instance.current = new Class(id, audioContext, initialPosition)
	}
	useEffect(() => {
		const {current} = boundary
		current.dispatchEvent(new CustomEvent('node-added', {detail: {id, type: Class.type}}))
		return () => {
			current.dispatchEvent(new CustomEvent('node-removed', {detail: {id, type: Class.type}}))
		}
	}, [Class, id, boundary])

	const ref = useRef(/** @type {HTMLDivElement} */(null))
	const header = useRef(/** @type {HTMLDivElement} */(null))

	const position = useRef({...instance.current.data.dom})
	const slotsRef = useRef({})

	const [hasDestination, setHasDestination] = useState(false)
	useImperativeHandle(handle, () => ({
		slots: slotsRef.current,
		connections: instance.current.data.connections,
		position: position.current,
		instance: instance.current,
		Class: Class,
		onDestinationChange: (newDestinationState) => {
			if(newDestinationState !== hasDestination) {
				setHasDestination(newDestinationState)
			}
		}
	}))
	useEffect(() => {
		const controller = new AbortController()
		let dx = 0
		let dy = 0
		let initial
		let start
		let rafId
		let hasMoved
		if (startHeld) {
			initial = {...position.current}
			start = true
			header.current.style.setProperty('cursor', 'grabbing')
		}
		header.current.addEventListener('mousedown', e => {
			if(e.button !== 0)
				return
			start = {x: e.clientX, y: e.clientY}
			initial = {...position.current}
			hasMoved = false
			header.current.style.setProperty('cursor', 'grabbing')
		}, {signal: controller.signal})
		window.addEventListener('mousemove', e => {
			if(!start) return
			hasMoved = true
			if(start === true) {
				start = {
					x: e.clientX + 75,
					y: e.clientY + 20,
				}
			}
			dx = e.clientX - start.x
			dy = e.clientY - start.y
			cancelAnimationFrame(rafId)
			rafId = requestAnimationFrame(() => {
				ref.current.style.setProperty(
					'transform',
					`translate(${dx}px, ${dy}px)`
				)
			})
		}, {signal: controller.signal})
		window.addEventListener('mouseup', (e) => {
			if (!start) return
			start = null
			if (!hasMoved) {
				header.current.style.removeProperty('cursor')
				return
			}
			cancelAnimationFrame(rafId)
			rafId = requestAnimationFrame(() => {
				position.current.x = Math.round(initial.x + dx)
				position.current.y = Math.round(initial.y + dy)
				ref.current.style.setProperty('--x', position.current.x)
				ref.current.style.setProperty('--y', position.current.y)
				ref.current.style.removeProperty('transform')
				header.current.style.removeProperty('cursor')
				ref.current.dispatchEvent(new CustomEvent('node-moved', {bubbles: true}))
				instance.current.data.dom = {...position.current}
				instance.current.saveToLocalStorage()
			})
		}, {signal: controller.signal})
		return () => {
			controller.abort()
			cancelAnimationFrame(rafId)
		}
	}, [startHeld])

	const form = useRef(/** @type {HTMLFormElement} */(null))
	useEffect(() => {
		if (!Class.structure.settings?.length)
			return
		const controller = new AbortController()
		const onChange = (event) => {
			const settingName = event.target.name
			const structure = Class.structure.settings.find(({name}) => name === settingName)
			if (!structure)
				return
			if (event.type === structure.event || (event.type === 'input' && !structure.event)) {
				instance.current.data.settings[settingName] = getIn(event.target, structure.readFrom)
				if (instance.current.audioNode)
					instance.current.updateSetting(settingName, ref.current)
				instance.current.saveToLocalStorage()
			}
		}
		const changeListenersCount = Class.structure.settings.filter(({event}) => event === 'change').length
		const inputListenersCount = Class.structure.settings.length - changeListenersCount
		
		if (changeListenersCount)
			form.current.addEventListener('change', onChange, {signal: controller.signal})
		if (inputListenersCount)
			form.current.addEventListener('input', onChange, {signal: controller.signal})
		return () => {
			controller.abort()
		}
	}, [Class])

	const onDelete = () => {
		instance.current.destroy()
		removeNode(id)
	}

	const [hover, setHover] = useState(false)
	const outputsCount = Class.structure.slots.filter(({type}) => type === 'output').length
	const inputsCount = Class.structure.slots.length - outputsCount
	return (
		<div
			className={classNames(styles.main, {
				[styles.hover]: hover
			})}
			ref={ref}
			style={{
				'--x': position.current.x,
				'--y': position.current.y,
			}}
		>
			<div className={styles.header}>
				<span className={classNames(styles.status, {
					[styles.hasDestination]: hasDestination
				})}/>
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
					'--inputs': inputsCount,
					'--outputs': outputsCount,
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
								instance={instance}
							/>
						))}
					</form>
				)}
				{Class.structure.extras?.map((extra) => (
					<Extra
						{...extra}
						key={extra.name}
						instance={instance}
					/>
				))}
			</div>
		</div>
	)
}

export default memo(Node)