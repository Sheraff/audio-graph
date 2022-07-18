import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react'
import Gain from './gain'

const GraphAudioContext = createContext(/** @type {string | AudioContext} */('Missing AudioContext Provider'))
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


export default function GainComponent({id}) {
	const audioContext = useContext(GraphAudioContext)
	const instance = useRef(/** @type {Gain?} */(null))
	const controls = useRef(/** @type {GainControls?} */({}))
	if (!instance.current) {
		instance.current = new Gain(id, audioContext, controls)
	}
	return (
		<Node
			controls={controls}
			id={id}
			structure={Gain.structure}
			settings={instance.current.data.settings}
		/>
	)
}

const modules = [
	Gain,
]
function Graph() {
	const [nodes, setNodes] = useState(() => {
		const save = localStorage.getItem('nodes')
		if (save) {
			return JSON.parse(localStorage.getItem('nodes'))
		} else {
			console.log('No saved nodes, should create default')
			return []
		}
	})

	const ricId = useRef(null)
	useEffect(() => {
		return () => {
			cancelIdleCallback(ricId.current)
		}
	}, [])
	const nodesRef = useRef(nodes)
	useEffect(() => { nodesRef.current = nodes }, [nodes])
	const save = useCallback(() => {
		if(ricId.current)
			return
		ricId.current = requestIdleCallback(() => {
			ricId.current = null
			localStorage.setItem('nodes', JSON.stringify(nodesRef.current))
		})
	}, [])

	const addNode = useCallback((node) => {
		setNodes(nodes => [...nodes, node])
		save()
	}, [save])
	const removeNode = useCallback((id) => {
		setNodes(nodes => nodes.filter(node => node.id !== id))
		save()
	}, [save])

	return (
		<GraphAudioContextProvider modules={modules}>
			<Canvas />
			{nodes.map(({id, type}) => 
				<Node
					key={id}
					id={id}
					type={modules[type]}
					removeNode={removeNode}
				/>
			)}
			<UI addNode={addNode} />
		</GraphAudioContextProvider>
	)
}