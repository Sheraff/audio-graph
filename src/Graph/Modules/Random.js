import GraphAudioNode from "./GraphAudioNode"

export default class Random extends GraphAudioNode {
	static type = 'random'
	static image = `${process.env.PUBLIC_URL}/icons/random.svg`
	static isSink = false
	static requiresSinkToPlay = false
	static structure = {
		slots: [
			{type: 'output', name: 0},
			{type: 'setting', name: 'variability'},
			{type: 'setting', name: 'rate'},
		],
		settings: [
			{
				name: 'variability',
				type: 'range',
				props: {
					min: 0,
					max: 100,
					step: 1
				},
				defaultValue: 10,
				readFrom: 'value'
			},
			{
				name: 'rate',
				type: 'range',
				props: {
					min: 0,
					max: 4000,
					step: 0.1
				},
				defaultValue: 60,
				readFrom: 'value'
			},
			{
				name: 'amplitude',
				type: 'minmax',
				props: {
					min: -100,
					max: 100,
					step: 0.1
				},
				defaultValue: [0, 1],
				readFrom: 'values',
			},
			{
				name: 'smooth',
				type: 'checkbox',
				defaultValue: false,
				readFrom: 'checked',
			},
		]
	}

	static requiredModules = [
		`${process.env.PUBLIC_URL}/AudioWorklets/Random.js`
	]

	initializeAudioNodes(audioContext) {
		this.audioNode = new AudioWorkletNode(audioContext, 'random', {
			numberOfInputs: 0,
			outputChannelCount: [1],
			processorOptions: { sampleRate: audioContext.sampleRate },
		})

		this.makeParamObservable('variability')
		this.makeParamObservable('rate')
		
	}

	updateSetting(name) {
		if (name === 'variability') {
			this.audioNode.parameters.get('variability').value = parseFloat(this.data.settings.variability)
		} else if (name === 'rate') {
			this.audioNode.parameters.get('rate').value = parseFloat(this.data.settings.rate)
		} else if (name === 'amplitude') {
			this.audioNode.parameters.get('min').value = this.data.settings.amplitude[0]
			this.audioNode.parameters.get('max').value = this.data.settings.amplitude[1]
		} else if (name === 'smooth') {
			this.audioNode.parameters.get('smooth').value = this.data.settings.smooth
		}
	}
}