import GraphAudioNode from "./GraphAudioNode"

export default class AddInputs extends GraphAudioNode {
	static type = 'add-inputs'
	static image = `${process.env.PUBLIC_URL}/icons/add-inputs.svg`

	static structure = {
		slots: [
			{type: 'input', name: 0},
			{type: 'input', name: 1},
			{type: 'output', name: 0},
		],
	}

	static requiredModules = [
		`${process.env.PUBLIC_URL}/AudioWorklets/InputAdd.js`
	]

	initializeAudioNodes(audioContext) {
		this.audioNode = new AudioWorkletNode(audioContext, 'add-inputs', {numberOfInputs: 2})
	}

	updateSetting(name) {

	}
}