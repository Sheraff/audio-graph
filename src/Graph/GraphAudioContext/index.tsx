import { createContext, useEffect, useId, useState } from 'react'

export const GraphAudioContext = createContext<string | AudioContext>('Missing AudioContext Provider')

export const GraphAudioContextProvider = ({ children, modules }) => {
	const id = useId()
	const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
	useEffect(() => {
		const controller = new AbortController()
		const onAnyUserEvent = async () => {
			controller.abort()
			const context = new AudioContext()
			await Promise.all([
				context.suspend(), 
				...modules.flatMap(
					({requiredModules}) => requiredModules.map(
						(path) => context.audioWorklet.addModule(path)
					)
				)
			])
			window.dispatchEvent(new CustomEvent(id, {detail: context}))
			setAudioContext(context)
		}
		window.addEventListener('pointerdown', onAnyUserEvent, {
			once: true,
			passive: true,
			signal: controller.signal,
			capture: true,
		})
		window.addEventListener('keydown', onAnyUserEvent, {
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