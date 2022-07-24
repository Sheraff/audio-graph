import GraphAudioNode from "./GraphAudioNode"

export default class Constant extends GraphAudioNode {
	static type = 'constant'
	static image = `${process.env.PUBLIC_URL}/icons/constant.svg`
	static isSink = false
	static requiresSinkToPlay = false
	static structure = {
		slots: [
			{type: 'output', name: 0},
			{type: 'setting', name: 'offset'},
		],
		settings: [
			{
				name: 'offset',
				type: 'range',
				props: {
					min: -10,
					max: 10,
					step: 0.001,
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
		this.makeParamObservable('offset')
	}

	updateSetting(name) {
		if (name === 'offset') {
			this.audioNode.offset.value = this.data.settings.offset
		}
	}
}