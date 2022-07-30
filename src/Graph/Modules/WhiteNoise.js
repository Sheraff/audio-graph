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
			{
				name: 'amplitude',
				type: 'minmax',
				props: {
					min: 0,
					max: 1,
					step: 0.01
				},
				defaultValue: [0, 1],
				readFrom: 'values',
				controls: {
					min: 'min',
					max: 'max',
				}
			}
		]
	}

	static requiredModules = [
		`${process.env.PUBLIC_URL}/AudioWorklets/WhiteNoiseSource.js`
	]

	initializeAudioNodes(audioContext) {
		this.audioNode = new GainNode(audioContext, {gain: 0.1})

		this.customNodes.oscillator = new AudioWorkletNode(audioContext, 'white-noise-processor', {numberOfInputs: 0, outputChannelCount: [2]})
		this.customNodes.oscillator.connect(this.audioNode)

		Object.defineProperty(this.audioNode, 'parameters', {
			value: this.customNodes.oscillator.parameters,
			enumerable: true,
			configurable: true,
		})

		this.makeParamObservable('min')
		this.makeParamObservable('max')
	}

	updateSetting(name) {
		if (name === 'amplitude') {
			this.customNodes.oscillator.parameters.get('min').value = this.data.settings.amplitude[0]
			this.customNodes.oscillator.parameters.get('max').value = this.data.settings.amplitude[1]
		}
	}
}