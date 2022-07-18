import GraphAudioNode from "./GraphAudioNode"

export default class Visualizer extends GraphAudioNode {
	static type = 'visualizer'
	static image = `${process.env.PUBLIC_URL}/icons/visualizer.svg`

	static structure = {
		slots: [
			{type: 'input', name: 0},
		],
		extras: [
			{type: 'visualizer', name: 0}
		]
	}

	static requiredModules = [
		`${process.env.PUBLIC_URL}/AudioWorklets/Visualizer.js`
	]

	initializeAudioNodes(audioContext) {
		this.audioNode = new AudioWorkletNode(audioContext, 'visualizer', {numberOfOutputs: 0})
		const extraId = `${this.id}.extras.${Visualizer.structure.extras[0].name}`
		this.audioNode.port.onmessage = e => {
			window.dispatchEvent(new CustomEvent(extraId, {detail: {buffer: e.data.buffer}}))
		}
	}

	updateSetting(name) {
		
	}

	cleanup() {
		super.cleanup()
		this.audioNode.port.postMessage({type: 'stop'})
	}
}