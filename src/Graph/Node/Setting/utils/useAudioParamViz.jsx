import { useContext, useEffect } from "react"
import { GraphAudioContext } from "../../../GraphAudioContext"

function getNode(instance, name) {
	return instance.current.audioNode?.[name] || instance.current.audioNode?.parameters?.get(name)
}

export default function useAudioParamViz({
	instance,
	name,
	props,
	callback,
}) {
	const audioContext = useContext(GraphAudioContext)
	useEffect(() => {
		if (typeof audioContext === 'string') return

		const controller = new AbortController()

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
			instance.current.addEventListener('audio-node-created', () => {
				if (getNode(instance, name)?.observer)
					makeBuffer()
			}, {once: true, signal: controller.signal})
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
					const base = node.value
					const correction = base + array[0] - Math.min(node.maxValue, Math.max(node.minValue, base + array[0]))
					const avg = array[0] - correction
					const normalizedAvg = avg / (props.max - props.min)
					const normalizedBase = (base - props.min) / (props.max - props.min)

					callback(normalizedBase, normalizedAvg)
				})
			})
		}
		
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
	}, [instance, audioContext, name, props, callback])
}