import classNames from 'classnames'
import { useContext, useEffect, useId, useRef, useState } from 'react'
import { GraphAudioContext } from '../GraphAudioContext'
import styles from './index.module.css'

function downloadGraph() {
	const data = {...localStorage}
	console.log(data)
	const blob = new Blob([JSON.stringify(data)], { type: "text/json" })
	const link = document.createElement("a")

	link.download = "graph.json"
	link.href = window.URL.createObjectURL(blob)
	link.dataset.downloadurl = ["text/json", link.download, link.href].join(":")

	const evt = new MouseEvent("click", {
		view: window,
		bubbles: true,
		cancelable: true,
	})

	link.dispatchEvent(evt)
	link.remove()
}

function openGraph(e) {
	const file = e.target.files[0]
	if (!file) {
		return
	}
	const reader = new FileReader()
	reader.onload = function(e) {
		localStorage.clear()
		const contents = JSON.parse(e.target.result)
		Object.entries(contents).forEach(([key, value]) => {
			localStorage.setItem(key, value)
		})
		window.location.reload()
	}
	reader.readAsText(file)
}

function clear() {
	localStorage.clear()
	localStorage.setItem('nodes', '[]')
	window.location.reload()
}

export default function UI({addNode, modules}) {
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
			else
				audioContext.resume()
		}
	}, [audioContext])

	const [show, setShow] = useState(false)
	const onAddNode = (type) => {
		addNode(type)
		setShow(false)
	}

	const ref = useRef(/** @type {HTMLDivElement} */(null))
	useEffect(() => {
		if(!show)
			return
		const controller = new AbortController()
		window.addEventListener('keydown', (e) => {
			if(e.key === 'Escape')
				setShow(false)
		}, {signal: controller.signal})
		window.addEventListener('click', (e) => {
			if(!ref.current.contains(e.target))
				setShow(false)
		}, {signal: controller.signal})
		return () => {
			controller.abort()
		}
	}, [show])

	return (
		<div
			ref={ref}
			className={classNames(styles.main, {
				[styles.show]: show,
			})}
		>
			{modules.map(({type, image}) => (
				<div key={type} className={styles.item}>
					<button
						type="button"
						onClick={() => onAddNode(type)}
					>
						<img src={image} alt="" width="1" height="1"/>
						{type}
					</button>
				</div>
			))}
			<div className={styles.bottom}>
				<button
					className={styles.toggle}
					type="button"
					title="add node"
					onClick={() => setShow(a => !a)}
					aria-label="toggle hud"
				>
					{show ? '×' : '+'}
				</button>
				<button
					className={styles.play}
					type='button'
					title={`${play ? 'pause' : 'play'} graph`}
					onClick={onTogglePlay}
					aria-label={play ? 'pause' : 'play'}
				>
					{play ? '▮▮' : '▶'}
				</button>
				<a
					className={styles.github}
					href="https://github.com/Sheraff/audio-graph"
					target="_blank"
					title="see source code on github"
				>
					<img src={`${process.env.PUBLIC_URL}/github.png`} width="1" height="1" alt=""/>
				</a>
				<button className={styles.file} title="download graph" type="button" onClick={downloadGraph}>DL</button>
				<label className={styles.file} title="upload graph">
					UP
					<input type="file" onChange={openGraph} accept=".json,text/json,application/json" hidden/>
				</label>
				<button className={styles.file} title="clear graph" type="button" onClick={clear}>🚫</button>
			</div>
		</div>
	)
}