import GraphAudioNode from "./GraphAudioNode"

export default class Merge extends GraphAudioNode {
	static type = 'merge'
	static image = `${process.env.PUBLIC_URL}/icons/merge.svg`

	static structure = {
		slots: [
			{type: 'input', name: 0},
			{type: 'input', name: 1},
			{type: 'input', name: 2},
			{type: 'input', name: 3},
			{type: 'input', name: 4},
			{type: 'input', name: 5},
			{type: 'output', name: 0},
		],
	}

	static requiredModules = []

	initializeAudioNodes(audioContext) {
		this.audioNode = new ChannelMergerNode(audioContext)
	}

	updateSetting(name) {

	}
}