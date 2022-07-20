import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Gain from './Modules/Gain'
import { GraphAudioContextProvider } from './GraphAudioContext'
import Node from './Node'
import UI from './UI'
import styles from './index.module.css'
import Oscillator from './Modules/Oscillator'
import Output from './Modules/Output'
import Connector from './Connector'
import LFO from './Modules/LFO'
import Pan from './Modules/Pan'
import Delay from './Modules/Delay'
import BiQuadFilter from './Modules/BiQuadFilter'
import Merge from './Modules/Merge'
// import Split from './Modules/Split'
import Constant from './Modules/Constant'
import Compressor from './Modules/Compressor'
import WhiteNoise from './Modules/WhiteNoise'
import AddInputs from './Modules/AddInputs'
import Automation from './Modules/Automation'
// import Visualizer from './Modules/Visualizer'
import Multiplier from './Modules/Multiplier'
import ToMono from './Modules/ToMono'
import Duplicate from './Modules/Duplicate'
import Analyser from './Modules/Analyser'
import FileSource from './Modules/FileSource'
import Waveform from './Modules/Waveform'
import Sequencer from './Modules/Sequencer'
import NoteOscillator from './Modules/NoteOscillator'
import BalanceDisplay from './Modules/BalanceDisplay'
import Reverb from './Modules/Reverb'

const modules = [
	Output,
	Gain,
	Oscillator,
	LFO,
	Pan,
	Delay,
	BiQuadFilter,
	Merge,
	// Split,
	Constant,
	Compressor,
	WhiteNoise,
	AddInputs,
	Multiplier,
	Automation,
	// Visualizer,
	Analyser,
	ToMono,
	Duplicate,
	FileSource,
	Waveform,
	Sequencer,
	NoteOscillator,
	BalanceDisplay,
	Reverb,
]

export default function Graph() {
	const ref = useRef(/** @type {HTMLDivElement} */(null))

	const [nodes, setNodes] = useState(() => {
		const save = localStorage.getItem('nodes')
		if (save) {
			return JSON.parse(save)
		} else {
			console.log('No saved nodes, should create default')
			return []
		}
	})

	const ricId = useRef(/** @type {number?} */(null))
	useEffect(() => {
		return () => {
			if(ricId.current)
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

	const [offset, setOffset] = useState({x: 0, y: 0})
	useEffect(() => {
		const onNodePlacement = () => {
			const offset = Object.values(canvasNodesHandle.current).reduce(({x, y}, node) => {
				if(!node?.position)
					return {x, y}
				return {
					x: Math.max(x, node.position.x),
					y: Math.max(y, node.position.y),
				}
			}, {x: 0, y: 0})
			setOffset(offset)
		}
		onNodePlacement()
		const controller = new AbortController()
		ref.current.addEventListener('node-moved', onNodePlacement, {signal: controller.signal})
		return () => {
			controller.abort()
		}
	}, [])

	const handles = useMemo(() => {
		return nodes.map(({id}) => 
			(handle) => canvasNodesHandle.current[id] = handle
		)
	}, [nodes])

	return (
		<GraphAudioContextProvider modules={modules}>
			<div
				ref={ref}
				className={styles.main}
				style={{
					'--x': offset.x,
					'--y': offset.y,
				}}
			>
				<Connector boundary={ref} handles={canvasNodesHandle}>
					{nodes.map(({id, type, initialPosition}, i) => 
						<Node
							key={id}
							id={id}
							Class={modules.find(Class => Class.type === type)}
							initialPosition={initialPosition}
							removeNode={removeNode}
							handle={handles[i]}
						/>
					)}
					<UI addNode={addNode} modules={modules} />
				</Connector>
			</div>
		</GraphAudioContextProvider>
	)
}