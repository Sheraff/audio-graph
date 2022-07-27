import GraphAudioNode from "./GraphAudioNode"

export default class WhiteNoise extends GraphAudioNode {
	static type = 'white-noise'
	static image = `${process.env.PUBLIC_URL}/icons/white-noise.svg`
	static isSink = false
	static requiresSinkToPlay = false
	static structure = {
		slots: [
			{type: 'output', name: 0},
			{type: 'setting', name: 'min'},
			{type: 'setting', name: 'max'},
		],
		settings: [
			{name: 'min', type: 'range', props: {min: 0, max: 1, step: 0.01}, defaultValue: 0, readFrom: 'value'},
			{name: 'max', type: 'range', props: {min: 0, max: 1, step: 0.01}, defaultValue: 1, readFrom: 'value'},
		]
	}

	static requiredModules = [
		`${process.env.PUBLIC_URL}/AudioWorklets/WhiteNoiseSource.js`
	]

	initializeAudioNodes(audioContext) {
		this.audioNode = new GainNode(audioContext, {gain: 0.1})

		this.customNodes.oscillator = new AudioWorkletNode(audioContext, 'white-noise-processor', {numberOfInputs: 0, outputChannelCount: [2]})
		this.customNodes.oscillator.connect(this.audioNode)
		this.makeParamObservable('min')
		this.makeParamObservable('max')
	}

	updateSetting(name) {
		if (name === 'min') {
			this.customNodes.oscillator.parameters.get('min').value = parseFloat(this.data.settings.min)
		} else if (name === 'max') {
			this.customNodes.oscillator.parameters.get('max').value = parseFloat(this.data.settings.max)
		}
	}
}