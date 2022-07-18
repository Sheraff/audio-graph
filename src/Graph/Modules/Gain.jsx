import { createContext, useContext, useEffect, useId, useRef, useState } from 'react'
import Gain from './gain'

const GraphAudioContext = createContext(/** @type {string | AudioContext?} */(null))
const GraphAudioContextProvider = ({ children, modules }) => {
	const id = useId()
	const [audioContext, setAudioContext] = useState(/** @type {AudioContext?} */(null))
	useEffect(() => {
		const controller = new AbortController()
		window.addEventListener('click', async () => {
			const context = new AudioContext()
			await Promise.all(modules.flatMap(
				({requiredModules}) => requiredModules.map(
					(path) => context.audioWorklet.addModule(path)
				)
			))
			setAudioContext(context)
		}, {
			once: true, 
			passive: true, 
			signal: controller.signal, 
			capture: true,
		})
		return () => {
			controller.abort()
		}
	}, [])
	return (
		<GraphAudioContext.Provider value={audioContext || id}>
			{children}
		</GraphAudioContext.Provider>
	)
}


export default function GainComponent({id}) {
	const audioContext = useContext(GraphAudioContext)
	const gain = useRef(/** @type {Gain?} */(null))
	const controls = useRef(/** @type {GainControls?} */({}))
	if (!gain.current) {
		gain.current = new Gain(id, audioContext, controls)
	}
	return (
		<Node
			controls={controls}
			id={id}
			structure={Gain.structure}
			settings={gain.current.data.settings}
		/>
	)
}