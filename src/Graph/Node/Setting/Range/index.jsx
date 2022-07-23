import { useContext, useEffect, useRef } from 'react'
import { GraphAudioContext } from '../../../GraphAudioContext'
import styles from './index.module.css'

function getNode(instance, name) {
	return instance.current.audioNode?.[name] || instance.current.audioNode?.parameters?.get(name)
}

export default function Range({id, name, defaultValue, props, instance}){
	const range = useRef(null)
	const text = useRef(null)
	const touched = useRef(false)
	useEffect(() => {
		if(touched.current) return
		text.current.value = defaultValue
		range.current.value = defaultValue
	}, [defaultValue])

	const audioContext = useContext(GraphAudioContext)
	const ref = useRef(null)
	useEffect(() => {
		if (typeof audioContext === 'string') return

		let array
		let bufferLength
		function makeBuffer() {
			const node = getNode(instance, name)
			bufferLength = node.observer.frequencyBinCount
			array = new Float32Array(bufferLength)
		}
		if (getNode(instance, name)?.observer) {
			makeBuffer()
		} else {
			instance.current.onAudioNode = () => {
				if (getNode(instance, name)?.observer)
					makeBuffer()
			}
		}
		
		let rafId
		function loop() {
			rafId = requestAnimationFrame(() => {
				rafId = requestAnimationFrame(() => { // skip a frame to avoid lag
					loop()
					if(!array)
						return
					const node = getNode(instance, name)
					if (node.observer.frequencyBinCount !== bufferLength)
						makeBuffer()
					
					node.observer.getFloatTimeDomainData(array)
					const avg = array[0]
					const base = node.value
					const normalizedAvg = avg / (props.max - props.min)
					const normalizedBase = (base - props.min) / (props.max - props.min)

					ref.current.style.setProperty('--base', normalizedBase)
					ref.current.style.setProperty('--value', normalizedAvg)
				})
			})
		}
		
		const controller = new AbortController()
		audioContext.addEventListener('statechange', (event) => {
			if(audioContext.state === 'running')
				loop()
			else 
				cancelAnimationFrame(rafId)
		}, {signal: controller.signal})
		
		if (audioContext.state === 'running') loop()
		
		return () => {
			cancelAnimationFrame(rafId)
			controller.abort()
		}
	}, [instance, audioContext, name, props])

	return (
		<>
			<div className={styles.cell}>
				<div ref={ref} className={styles.main} style={{'--base': 0, '--value': 0}}>
					<input
						ref={range}
						onChange={() => {
							touched.current = true
							text.current.value = range.current.value
						}}
						type="range"
						name={name}
						defaultValue={defaultValue}
						{...props}
						id={id}
						className={styles.range}
					/>
				</div>
			</div>
			<input
				ref={text}
				onChange={() => {
					touched.current = true
					range.current.value = Number(text.current.value)
					range.current.dispatchEvent(new Event('input', {bubbles: true}))
				}}
				type="number"
				{...props}
				htmlFor={id}
				defaultValue={defaultValue}
				className={styles.text}
			/>
		</>
	)
}