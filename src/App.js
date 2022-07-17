import styles from './app.module.css'
import Graph from './Graph'
import Waveform from './Waveform'
import AutomationTrack from './AutomationTrack'

function App() {
	return (
		<div className={styles.main}>
			<Graph/>
			{/* <Waveform/> */}
			<AutomationTrack />
		</div>
	)
}

export default App
