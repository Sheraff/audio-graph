/* eslint-disable */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Connections from './Connections'
import styles from './index.module.css'
import Node from './Node'
import TYPES from './Node/Types'
import Player from './Player'

const defaultInitialNodes = [
	{
		id: '0',
		x: 300,
		y: 300,
		type: 'output',
	},
	{
		id: '1',
		x: 100,
		y: 100,
		type: 'gain',
	},
]

let id = 1


export default function Graph() {
	const nodeRefs = useRef([])
	const connectionRefs = useRef({})
	const playerRef = useRef(null)
	const [nodes, setNodes] = useState(() => {
		const storedNodes = localStorage.getItem('nodes')
		if (storedNodes) {
			const nodes = JSON.parse(storedNodes)
			const maxIndex = Math.max(...nodes.map((node) => Number(node.id)))
			id = maxIndex + 1
			return nodes
		}
		return defaultInitialNodes
	})

	const nodeContainer = useRef(/** @type {HTMLDivElement} */(null))

	const setSelves = useMemo(() => nodes.map((_,i) => (callback) => setNodes((prev) => {
		const newNodes = [...prev]
		newNodes[i] = typeof callback === 'function'
			? callback(prev[i])
			: callback
		return newNodes
	})), [nodes.length])

	const deleteSelves = useMemo(() => nodes.map((_,i) => () => {
		connectionRefs.current.deleteNodeConnections(nodes[i].id)
		setNodes((prev) => {
			const newNodes = [...prev]
			newNodes.splice(i, 1)
			return newNodes
		})
	}), [nodes.length])

	const [play, setPlay] = useState(false)

	const onNode = useCallback(async () => {
		await playerRef.current?.loadModules()
		playerRef.current?.updateNodes()
	}, [])
	const onSettings = useCallback(() => playerRef.current?.updateSettings(), [])
	const onConnect = useCallback(() => playerRef.current?.updateConnections(), [])

	useEffect(() => {
		onNode()
		const ricID = requestIdleCallback(() => {
			localStorage.setItem(`nodes`, JSON.stringify(nodes))
		})
		return () => {
			cancelIdleCallback(ricID)
		}
	}, [nodes])

	const select = useRef(/** @type {HTMLSelectElement} */(null))
	const onFocus = () => {
		select.current.value = -1
	}
	const onSelect = () => {
		setNodes((prev) => ([
			...prev,
			{
				id: `${++id}`,
				x: 100,
				y: 300,
				type: select.current.value,
			}
		]))
	}

	const maxX = Math.max(...nodes.map((node) => node.x))
	const maxY = Math.max(...nodes.map((node) => node.y))
	nodeRefs.current = []
	return (
		<div className={styles.main} style={{
			minWidth: `${maxX + 300}px`,
			minHeight: `${maxY + 300}px`,
		}}>
			<div ref={nodeContainer}>
				{nodes.map((node, i) => (
					<Node
						key={node.id + node.type}
						ref={e => nodeRefs.current[i] = e}
						{...node}
						setSelf={setSelves[i]}
						deleteSelf={deleteSelves[i]}
						onSettings={onSettings}
					/>
				))}
			</div>
			<Connections ref={connectionRefs} nodeContainer={nodeContainer} nodeRefs={nodeRefs} onConnect={onConnect}/>
			<select id="new-node-type" ref={select} onChange={onSelect} onFocus={onFocus}>
				{Object.keys(TYPES).map(type => (
					<option value={type} key={type}>{type}</option>
				))}
			</select>
			{!play && (
				<button
					type='button'
					onClick={() => setPlay(true)}
					aria-label='Play'
				>
					▶
				</button>
			)}
			{play && (
				<Player ref={playerRef} nodes={nodeRefs} connections={connectionRefs}/>
			)}
		</div>
	)
}