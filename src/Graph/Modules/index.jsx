import { useCallback, useEffect, useRef, useState } from 'react'
import Gain from './Classes/Gain'
import { GraphAudioContextProvider } from './GraphAudioContext'
import Node from './Node'
import UI from './UI'
import styles from './index.module.css'
import Oscillator from './Classes/Oscillator'
import Output from './Classes/Output'
import Connector from './Connector'
import LFO from './Classes/LFO'
import Pan from './Classes/Pan'
import Delay from './Classes/Delay'
import BiQuadFilter from './Classes/BiQuadFilter'
import Merge from './Classes/Merge'
import Split from './Classes/Split'
import Constant from './Classes/Constant'
import Compressor from './Classes/Compressor'
import WhiteNoise from './Classes/WhiteNoise'
import AddInputs from './Classes/AddInputs'
import Automation from './Classes/Automation'
import Visualizer from './Classes/Visualizer'
import Multiplier from './Classes/Multiplier'
import ToMono from './Classes/ToMono'
import Duplicate from './Classes/Duplicate'

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
	Visualizer,
	ToMono,
	Duplicate,
]

export default function Graph() {
	const ref = useRef(/** @type {HTMLDivElement} */(null))

	const [nodes, setNodes] = useState(() => {
		// return []
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

	return (
		<GraphAudioContextProvider modules={modules}>
			<div ref={ref} className={styles.main}>
				<Connector boundary={ref} handles={canvasNodesHandle}>
					{/* <Canvas /> */}
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
				</Connector>
			</div>
		</GraphAudioContextProvider>
	)
}