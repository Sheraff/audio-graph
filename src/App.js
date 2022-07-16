import styles from './app.module.css'
import Graph from './Graph'
import Waveform from './Waveform'

function App() {
	return (
		<div className={styles.main}>
			<Graph/>
			<Waveform/>
		</div>
	)
}

export default App
