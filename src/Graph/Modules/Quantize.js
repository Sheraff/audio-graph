import GraphAudioNode from "./GraphAudioNode"

export default class Quantize extends GraphAudioNode {
	static type = 'quantize'
	static image = `${process.env.PUBLIC_URL}/icons/quantize.svg`
	static isSink = false
	static requiresSinkToPlay = false
	static structure = {
		slots: [
			{type: 'output', name: 0},
			{type: 'input', name: 0},
			// {type: 'setting', name: 'step'},
		],
		settings: [
			{
				name: 'step',
				type: 'range',
				props: {
					min: 0.01,
					max: 1000,
					step: 0.01
				},
				defaultValue: 1,
				readFrom: 'value'
			},
		]
	}

	static requiredModules = [
		`${process.env.PUBLIC_URL}/AudioWorklets/Quantize.js`
	]

	initializeAudioNodes(audioContext) {
		this.audioNode = new AudioWorkletNode(audioContext, 'quantize', {outputChannelCount: [2]})

		this.makeParamObservable('step')
	}

	updateSetting(name) {
		if (name === 'step') {
			this.audioNode.parameters.get('step').value = parseFloat(this.data.settings.step)
		}
	}
}