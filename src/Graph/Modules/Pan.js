import GraphAudioNode from "./GraphAudioNode"

export default class Pan extends GraphAudioNode {
	static type = 'pan'
	static image = `${process.env.PUBLIC_URL}/icons/pan.svg`
	static isSink = false
	static requiresSinkToPlay = false
	static structure = {
		slots: [
			{type: 'input', name: 0},
			{type: 'output', name: 0},
			{type: 'setting', name: 'pan'},
		],
		settings: [
			{
				name: 'pan',
				type: 'range',
				props: {
					min: -1,
					max: 1,
					step: 0.01,
				},
				defaultValue: 0,
				readFrom: 'value',
			}
		]
	}

	static requiredModules = []

	initializeAudioNodes(audioContext) {
		this.audioNode = new StereoPannerNode(audioContext)
	}

	updateSetting(name) {
		if (name === 'pan') {
			this.audioNode.pan.value = this.data.settings.pan
		}
	}
}