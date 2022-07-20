import GraphAudioNode from "./GraphAudioNode"

export default class Duplicate extends GraphAudioNode {
	static type = 'duplicate'
	static image = `${process.env.PUBLIC_URL}/icons/duplicate.svg`

	static structure = {
		slots: [
			{type: 'input', name: 0},
			{type: 'output', name: 0},
			{type: 'output', name: 1},
			{type: 'output', name: 2},
			{type: 'output', name: 3},
			{type: 'output', name: 4},
			{type: 'output', name: 5},
		],
	}

	static requiredModules = [
		`${process.env.PUBLIC_URL}/AudioWorklets/Duplicate.js`
	]

	initializeAudioNodes(audioContext) {
		this.audioNode = new AudioWorkletNode(audioContext, 'duplicate', {numberOfOutputs: 6, channelCount: 2, outputChannelCount: [2, 2, 2, 2, 2, 2]})
	}

	updateSetting(name) {
		
	}
}