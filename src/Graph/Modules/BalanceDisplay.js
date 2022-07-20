import GraphAudioNode from "./GraphAudioNode"


export default class BalanceDisplay extends GraphAudioNode {
	static type = 'balance-display'
	static image = `${process.env.PUBLIC_URL}/icons/balance-display.svg`

	static structure = {
		slots: [
			{type: 'custom', name: 'input'},
			{type: 'output', name: 0},
		],
		extras: [
			{type: 'balance-display', name: 0}
		]
	}

	static requiredModules = []

	initializeAudioNodes(audioContext) {
		this.customNodes.input = new GainNode(audioContext)
		const split = new ChannelSplitterNode(audioContext, {numberOfOutputs: 2})
		this.customNodes.input.connect(split, 0, 0)
		this.customNodes.left = new AnalyserNode(audioContext)
		this.customNodes.right = new AnalyserNode(audioContext)
		split.connect(this.customNodes.left, 0, 0)
		split.connect(this.customNodes.right, 1, 0)

		const merger = new ChannelMergerNode(audioContext, {numberOfInputs: 2})
		this.customNodes.left.connect(merger, 0, 0)
		this.customNodes.right.connect(merger, 0, 1)

		this.audioNode = merger

		const mute = new GainNode(audioContext, {gain: 0})
		merger.connect(mute)
		mute.connect(audioContext.destination)

		if (this.onAudioNode) {
			this.onAudioNode()
			delete this.onAudioNode
		}
	}

	updateSetting(name) {

	}
}
