import { useContext, useEffect, useState } from 'react'
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