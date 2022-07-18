import { useContext, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { GraphAudioContext } from '../GraphAudioContext'

export default function GainComponent({Class, id, initialPosition, handle}) {
	const audioContext = useContext(GraphAudioContext)
	const instance = useRef(/** @type {typeof Class?} */(null))
	const controls = useRef(/** @type {GainControls?} */({}))
	if (!instance.current) {
		instance.current = new Class(id, audioContext, controls, initialPosition)
	}
	useEffect(() => {
		return () => {
			instance.current.destroy()
		}
	}, [])
	const ref = useRef(/** @type {HTMLDivElement} */(null))
	const [staticPosition, setPosition] = useState(instance.current.data.dom)
	const dynamicPosition = useRef(instance.current.data.dom)
	useImperativeHandle(handle, () => dynamicPosition.current)
	useEffect(() => {
		dynamicPosition.current = staticPosition
	}, [staticPosition])
	useEffect(() => {
		let dx = 0
		let dy = 0
		const initial = dynamicPosition.current
		let start
		const onStart = (e) => {
			start = {x: e.clientX, y: e.clientY}
		}
		const onMove = (e) => {
			if(!start) return
			dx = e.clientX - start.x
			dy = e.clientY - start.y
			dynamicPosition.current = initial.x + dx
			dynamicPosition.current = initial.y + dy
			ref.current.style.setProperty(
				'transform',
				`translate(${dynamicPosition.current.x}px, ${dynamicPosition.current.y}px)`
			)
		}
		const onEnd = () => {
			start = null
			setPosition(({x, y}) => ({
				x: x + dx,
				y: y + dy,
			}))
			ref.current.style.removeProperty('transform')
		}
	}, [])
	return (
		<Node
			ref={ref}
			style={{'--x': staticPosition.x, '--y': staticPosition.y}}
			controls={controls}
			id={id}
			structure={Class.structure}
			settings={instance.current.data.settings}
		/>
	)
}