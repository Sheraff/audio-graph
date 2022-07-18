import classNames from 'classnames'
import { useContext, useEffect, useRef, useState } from 'react'
import { GraphAudioContext } from '../GraphAudioContext'
import styles from './index.module.css'

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
					onClick={() => setShow(a => !a)}
					aria-label="toggle hud"
				>
					{show ? '×' : '+'}
				</button>
				<button
					className={styles.toggle}
					type='button'
					onClick={onTogglePlay}
					aria-label={play ? 'pause' : 'play'}
				>
					{play ? '▮▮' : '▶'}
				</button>
				<a
					className={styles.github}
					href="https://github.com/Sheraff/audio-graph"
					target="_blank"
				>
					<img src={`${process.env.PUBLIC_URL}/github.png`} width="1" height="1" alt=""/>
				</a>
			</div>
		</div>
	)
}