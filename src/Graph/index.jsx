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
// import ReverbDynamic from './Modules/ReverbDynamic'
import Echo from './Modules/Echo'
import Wobble from './Modules/Wobble'
import KeyBoundConstant from './Modules/KeyBoundConstant'
import Distortion from './Modules/Distortion'
import WaveShaper from './Modules/WaveShaper'
import Sampler from './Modules/Sampler'
import Random from './Modules/Random'
import Quantize from './Modules/Quantize'
import LineIn from './Modules/LineIn'

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
	// ReverbDynamic,
	Echo,
	Wobble,
	KeyBoundConstant,
	Distortion,
	WaveShaper,
	Sampler,
	Random,
	Quantize,
	LineIn,
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

	const canvasNodesHandle = useRef({})

	useEffect(() => {
		const ricId = requestIdleCallback(() => {
			const data = nodes.map(({id, type}) => ({id, type}))
			localStorage.setItem('nodes', JSON.stringify(data))
		})
		return () => {
			cancelIdleCallback(ricId)
		}
	}, [nodes])


	const addNode = useCallback((type, startHeld) => {
		const initialPosition = startHeld
			? {
				x: startHeld.x + ref.current.scrollLeft,
				y: startHeld.y + ref.current.scrollTop,
			} : {
				x: ref.current.offsetWidth * 0.33 + ref.current.scrollLeft,
				y: ref.current.offsetHeight * 0.25 + ref.current.scrollTop,
			}
		const node = {
			type,
			id: `${Date.now()}${Math.round(Math.random() * 1000)}`,
			initialPosition,
			startHeld,
		}
		setNodes(nodes => [...nodes, node])
	}, [])

	const removeNode = useCallback((id) => {
		delete canvasNodesHandle.current[id]
		setNodes(nodes => nodes.filter(node => node.id !== id))
	}, [])

	const [offset, setOffset] = useState({x: 0, y: 0})
	useEffect(() => {
		const onNodePlacement = () => {
			const offset = Object.values(canvasNodesHandle.current).reduce(({x, y}, node) => {
				if(!node?.position || !node.position.x || !node.position.y)
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
		ref.current.addEventListener('node-removed', onNodePlacement, {signal: controller.signal})
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
					{nodes.map(({id, type, initialPosition, startHeld}, i) => 
						<Node
							key={id}
							id={id}
							Class={modules.find(Class => Class.type === type)}
							initialPosition={initialPosition}
							removeNode={removeNode}
							handle={handles[i]}
							boundary={ref}
							startHeld={startHeld}
						/>
					)}
					<UI addNode={addNode} modules={modules} />
				</Connector>
			</div>
		</GraphAudioContextProvider>
	)
}