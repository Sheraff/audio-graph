/* eslint-disable */
import classNames from 'classnames'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Connections from './Connections'
import styles from './index.module.css'
import Node from './Node'
import TYPES from './Node/Types'
import Player from './Player'

const defaultInitialNodes = [
	{
		id: '0',
		x: 500,
		y: 100,
		type: 'output',
	},
	{
		id: '1',
		x: 100,
		y: 100,
		type: 'oscillator',
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

	const [showHud, setShowHud] = useState(false)
	const onSelect = (type) => {
		setNodes((prev) => ([
			...prev,
			{
				id: `${Date.now()}`,
				x: document.scrollingElement.scrollLeft + innerWidth * 0.25,
				y: document.scrollingElement.scrollTop + innerHeight * 0.25,
				type,
			}
		]))
		setShowHud(false)
	}
	const hud = useRef(/** @type {HTMLDivElement} */(null))
	useEffect(() => {
		if(!showHud)
			return
		const controller = new AbortController()
		window.addEventListener('keydown', (e) => {
			if(e.key === 'Escape')
				setShowHud(false)
		}, {signal: controller.signal})
		window.addEventListener('click', (e) => {
			if(!hud.current.contains(e.target))
				setShowHud(false)
		}, {signal: controller.signal})
		return () => {
			controller.abort()
		}
	}, [showHud])

	const maxX = Math.max(...nodes.map((node) => node.x))
	const maxY = Math.max(...nodes.map((node) => node.y))
	nodeRefs.current = []
	return (
		<div className={styles.main} style={{
			minWidth: `${maxX + innerWidth}px`,
			minHeight: `${maxY + innerHeight}px`,
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
			<div ref={hud} className={classNames(styles.hud, {
				[styles.showHud]: showHud,
			})}>
				{Object.keys(TYPES).map((type, i) => (
					<div key={type} className={styles.hudItem}>
						<button type="button" onClick={() => onSelect(type)}>
							<img src={`${process.env.PUBLIC_URL}/icons/${type}.svg`} width="1" height="1" alt=""/>
							{type}
						</button>
					</div>
				))}
				<div className={styles.hudBottom}>
					<button className={styles.toggle} type="button" onClick={() => setShowHud(!showHud)} aria-label="toggle hud">
						{showHud ? '×' : '+'}
					</button>
					{!play && (
						<button
							type='button'
							onClick={() => setPlay(a => !a)}
							aria-label='Play'
						>
							▶
						</button>
					)}
					<a href="https://github.com/Sheraff/audio-graph" target="_blank" className={styles.github}>
						<img src={`${process.env.PUBLIC_URL}/github.png`} width="1" height="1" alt=""/>
					</a>
				</div>
			</div>
			{play && (
				<Player ref={playerRef} nodes={nodeRefs} connections={connectionRefs}/>
			)}
		</div>
	)
}