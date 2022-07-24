import classNames from 'classnames'
import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { GraphAudioContext } from '../GraphAudioContext'
import { Modules } from '../'
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

function openGraph(event: React.ChangeEvent<HTMLInputElement>) {
	const input = event.target as HTMLInputElement
	const file = input.files?.[0]
	if (!file) {
		return
	}
	const reader = new FileReader()
	reader.onload = function(e) {
		localStorage.clear()
		const result = e.target?.result
		if (typeof result !== 'string') {
			console.error('Could not read file during import')
			return
		}
		const contents = JSON.parse(result)
		Object.entries(contents).forEach(([key, value]) => {
			if (typeof value !== 'string') {
				console.error(`Could not read key from file during import: ${key}`)
				return
			}
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

export default function UI({
	addNode,
	modules
}: {
	addNode: (type: string, startHeld?: {x: number, y: number}) => void,
	modules: Modules,
}) {
	const audioContext = useContext(GraphAudioContext)

	const [play, setPlay] = useState(false)
	const onTogglePlay = useCallback(() => {
		setPlay(play => {
			if(typeof audioContext !== 'string') {
				if (play)
					audioContext.suspend()
				else
					audioContext.resume()
			}
			return !play
		})
	}, [audioContext])
	useEffect(() => {
		if(typeof audioContext !== 'string') {
			if(!play)
				audioContext.suspend()
			else
				audioContext.resume()
		}
	}, [audioContext])
	useEffect(() => {
		const controller = new AbortController()
		window.addEventListener('keydown', (e) => {
			if (e.key === ' ') {
				e.preventDefault()
				onTogglePlay()
			}
		}, {signal: controller.signal})
		return () => controller.abort()
	}, [onTogglePlay])

	const [show, setShow] = useState(false)

	const ref = useRef<HTMLDivElement>(null)
	useEffect(() => {
		if(!show)
			return
		const controller = new AbortController()
		window.addEventListener('keydown', (e) => {
			if(e.key === 'Escape')
				setShow(false)
		}, {signal: controller.signal})
		window.addEventListener('click', (e) => {
			if(!ref.current?.contains(e.target as Node))
				setShow(false)
		}, {signal: controller.signal})
		return () => {
			controller.abort()
		}
	}, [show])

	const buttons = useRef<HTMLDivElement>(null)
	useEffect(() => {
		const controller = new AbortController()
		let held = false
		buttons.current?.addEventListener('mousedown', (e) => {
			held = true
		}, {signal: controller.signal})
		buttons.current?.addEventListener('mouseup', (e) => {
			if(!held) return
			held = false
			const button = e.target as HTMLButtonElement
			const index = Number(button.dataset.index)
			const type = modules[index].type
			addNode(type)
			setShow(false)
		}, {signal: controller.signal})
		buttons.current?.addEventListener('mousemove', (e) => {
			if(!held) return
			held = false
			const button = e.target as HTMLButtonElement
			const index = Number(button.dataset.index)
			const type = modules[index].type
			addNode(type, {x: e.clientX, y: e.clientY})
			setShow(false)
		}, {signal: controller.signal})
		return () => {
			controller.abort()
		}
	}, [addNode, modules])

	return (
		<div
			ref={ref}
			className={classNames(styles.main, {
				[styles.show]: show,
			})}
		>
			<div className={styles.buttons} ref={buttons}>
				{modules.map(({type, image}, i) => (
					<button
						key={type}
						className={styles.item}
						type="button"
						data-index={i}
					>
						<img src={image} alt="" width="1" height="1"/>
						{type}
					</button>
				))}
			</div>
			<div className={styles.bottom}>
				<button
					type="button"
					title="add node"
					onClick={() => setShow(a => !a)}
					aria-label="toggle hud"
				>
					{show
						? <img src={`${process.env.PUBLIC_URL}/icons/ui-close.svg`} width="1" height="1" alt=""/>
						: <img src={`${process.env.PUBLIC_URL}/icons/ui-open.svg`} width="1" height="1" alt=""/>}
				</button>
				<button
					type='button'
					title={`${play ? 'pause' : 'play'} graph`}
					onClick={onTogglePlay}
					aria-label={play ? 'pause' : 'play'}
				>
					{play
						? <img src={`${process.env.PUBLIC_URL}/icons/ui-pause.svg`} width="1" height="1" alt=""/>
					 	: <img src={`${process.env.PUBLIC_URL}/icons/ui-play.svg`} width="1" height="1" alt=""/>}
				</button>
				<a
					href="https://github.com/Sheraff/audio-graph"
					target="_blank"
					title="see source code on github"
				>
					<img src={`${process.env.PUBLIC_URL}/github.png`} width="1" height="1" alt=""/>
				</a>
				<button title="download graph" type="button" onClick={downloadGraph}>
					<img src={`${process.env.PUBLIC_URL}/icons/ui-download.svg`} width="1" height="1" alt=""/>
				</button>
				<label className={styles.file} title="upload graph">
					<img src={`${process.env.PUBLIC_URL}/icons/ui-upload.svg`} width="1" height="1" alt=""/>
					<input type="file" onChange={openGraph} accept=".json,text/json,application/json" hidden/>
				</label>
				<button title="clear graph" type="button" onClick={clear}>
					<img src={`${process.env.PUBLIC_URL}/icons/ui-clear.svg`} width="1" height="1" alt=""/>
				</button>
			</div>
		</div>
	)
}