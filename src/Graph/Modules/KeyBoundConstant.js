import GraphAudioNode from "./GraphAudioNode"

export default class KeyBoundConstant extends GraphAudioNode {
	static type = 'mouse'
	static image = `${process.env.PUBLIC_URL}/icons/mouse.svg`
	static isSink = false
	static requiresSinkToPlay = false
	static structure = {
		slots: [
			{type: 'output', name: 0},
		],
		settings: [
			{
				name: 'binding',
				type: 'key-bound',
				props: {
					min: -1,
					max: 1,
					step: 0.0000001,
				},
				defaultValue: {key: 'e', value: 0},
				readFrom: 'binding',
			},
			{
				name: 'gain',
				type: 'range',
				props: {
					min: 0,
					max: 1000,
					step: 0.1,
				},
				defaultValue: 1,
				readFrom: 'value',
			},
		]
	}

	static requiredModules = []

	initializeAudioNodes(audioContext) {
		this.audioNode = new ConstantSourceNode(audioContext)
		this.audioNode.start()
	}

	updateSetting(name) {
		this.audioNode.offset.value = this.data.settings.gain * this.data.settings.binding.value
	}
}