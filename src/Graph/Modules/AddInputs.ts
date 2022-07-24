import GraphAudioNode from "./GraphAudioNode"

export default class AddInputs extends GraphAudioNode {
	static {
		this.type = 'add-inputs'
		this.image = `${process.env.PUBLIC_URL}/icons/add-inputs.svg`
		this.isSink = false
		this.requiresSinkToPlay = false
		this.structure = {
			slots: [
				{type: 'input', name: 0},
				{type: 'input', name: 1},
				{type: 'output', name: 0},
			],
		}

		this.requiredModules = [
			`${process.env.PUBLIC_URL}/AudioWorklets/InputAdd.js`
		]
	}

	initializeAudioNodes(audioContext: AudioContext) {
		this.audioNode = new AudioWorkletNode(audioContext, 'add-inputs', {numberOfInputs: 2})
	}

	updateSetting() {}
}