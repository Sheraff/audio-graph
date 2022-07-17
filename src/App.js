import styles from './app.module.css'
import Graph from './Graph'
import Waveform from './Waveform'
import example from './Graph/example'

if(localStorage.length === 0) {
	Object.entries(example).forEach(([key, value]) => {
		localStorage.setItem(key, JSON.stringify(value))
	})
}

function App() {
	return (
		<div className={styles.main}>
			<Graph/>
			{/* <Waveform/> */}
		</div>
	)
}

export default App
