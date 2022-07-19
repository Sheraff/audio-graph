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
		if (this.onAudioNode) {
			this.onAudioNode()
			delete this.onAudioNode
		}
	}

	updateSetting(name) {
		
	}

	cleanup() {
		super.cleanup()
		if (this.audioNode) {
			this.audioNode.port.postMessage({type: 'stop'})
		}
	}
}