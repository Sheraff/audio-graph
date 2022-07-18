import { createContext, useEffect, useId, useState } from 'react'

export const GraphAudioContext = createContext(/** @type {string | AudioContext} */('Missing AudioContext Provider'))

export const GraphAudioContextProvider = ({ children, modules }) => {
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
			window.dispatchEvent(new CustomEvent(id, {detail: context}))
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
	}, [modules, id])
	return (
		<GraphAudioContext.Provider value={audioContext || id}>
			{children}
		</GraphAudioContext.Provider>
	)
}