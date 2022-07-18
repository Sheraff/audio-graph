import GraphAudioNode from "./GraphAudioNode"

export default class Split extends GraphAudioNode {
	static type = 'split'
	static image = `${process.env.PUBLIC_URL}/icons/split.svg`

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

	static requiredModules = []

	initializeAudioNodes(audioContext) {
		this.audioNode = new ChannelSplitterNode(audioContext, {numberOfOutputs: 6})
	}

	updateSetting(name) {
		
	}
}