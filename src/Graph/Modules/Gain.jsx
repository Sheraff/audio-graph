import { createContext, useCallback, useContext, useEffect, useId, useImperativeHandle, useRef, useState } from 'react'
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

const modules = [
	Gain,
]
function Graph() {
	const ref = useRef(/** @type {HTMLDivElement} */(null))

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
			const data = nodesRef.current.map(({id, type}) => ({id, type}))
			localStorage.setItem('nodes', JSON.stringify(data))
		})
	}, [])

	const canvasNodesHandle = useRef({})

	const addNode = useCallback((type) => {
		const node = {
			type,
			id: `${Date.now()}${Math.round(Math.random() * 1000)}`,
			initialPosition: {
				x: ref.current.offsetWidth * 0.33 + ref.current.scrollLeft,
				y: ref.current.offsetHeight * 0.25 + ref.current.scrollTop,
			}
		}
		setNodes(nodes => [...nodes, node])
		save()
	}, [save])
	const removeNode = useCallback((id) => {
		delete canvasNodesHandle.current[id]
		setNodes(nodes => nodes.filter(node => node.id !== id))
		save()
	}, [save])

	return (
		<GraphAudioContextProvider modules={modules}>
			<div ref={ref} className={styles.main}>
				<Canvas />
				{nodes.map(({id, type, initialPosition}) => 
					<Node
						key={id}
						id={id}
						Class={modules.find(Class => Class.type === type)}
						initialPosition={initialPosition}
						removeNode={removeNode}
						handle={h => canvasNodesHandle.current[id] = h}
					/>
				)}
				<UI addNode={addNode} modules={modules} />
			</div>
		</GraphAudioContextProvider>
	)
}

function UI({addNode, modules}) {
	const audioContext = useContext(GraphAudioContext)

	const [play, setPlay] = useState(false)
	const onTogglePlay = () => {
		if(typeof audioContext !== 'string') {
			if (play)
				audioContext.suspend()
			else
				audioContext.resume()
		}
		setPlay(!play)
	}
	useEffect(() => {
		if(typeof audioContext !== 'string') {
			if(!play)
				audioContext.suspend()
		}
	}, [audioContext])

	const [show, setShow] = useState(false)

	return (
		<div className={styles.main}>
			{modules.map(({type, image}) => (
				<div key={type}>
					<button
						type="button"
						onClick={() => addNode(type)}
					>
						<img src={image} alt="" width="1" height="1"/>
						{type}
					</button>
				</div>
			))}
			<div className={styles.bottom}>
				<button
					type="button"
					onClick={() => setShow(a => !a)}
					aria-label="toggle hud"
				>
					{show ? '×' : '+'}
				</button>
				<button
					type='button'
					onClick={onTogglePlay}
					aria-label={play ? 'pause' : 'play'}
				>
					{play ? '▮▮' : '▶'}
				</button>
				<a href="https://github.com/Sheraff/audio-graph" target="_blank" className={styles.github}>
					<img src={`${process.env.PUBLIC_URL}/github.png`} width="1" height="1" alt=""/>
				</a>
			</div>
		</div>
	)
}