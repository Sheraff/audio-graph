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

	static requiredModules = [
		`${process.env.PUBLIC_URL}/AudioWorklets/ConstantCustom.js`
	]

	initializeAudioNodes(audioContext) {
		this.audioNode = new AudioWorkletNode(audioContext, 'constant-custom', {numberOfInputs: 0})
	}

	updateSetting(name) {
		if (name === 'offset') {
			this.audioNode.parameters.get('offset').value = parseFloat(this.data.settings.offset)
		}
	}
}