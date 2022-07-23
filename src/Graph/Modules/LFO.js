import GraphAudioNode from "./GraphAudioNode"

export default class LFO extends GraphAudioNode {
	static type = 'lfo'
	static image = `${process.env.PUBLIC_URL}/icons/lfo.svg`
	static isSink = false
	static requiresSinkToPlay = false
	static structure = {
		slots: [
			{type: 'setting', name: 'frequency'},
			{type: 'output', name: 0},
		],
		settings: [
			{
				name: 'frequency',
				type: 'range',
				props: {
					min: 0.01,
					max: 5,
					step: 0.01,
				},
				defaultValue: 0.5,
				readFrom: 'value',
			},
			{
				name: 'type',
				type: 'select',
				props: {
				},
				options: [
					"sine",
					"square",
					"sawtooth",
					"triangle",
				],
				defaultValue: "sine",
				readFrom: 'value',
			},
			{
				name: 'gain',
				type: 'range',
				props: {
					min: 0,
					max: 100,
					step: 0.1,
				},
				defaultValue: 1,
				readFrom: 'value',
			}
		]
	}

	static requiredModules = []

	initializeAudioNodes(audioContext) {
		this.audioNode = new GainNode(audioContext)
		this.oscillator = new OscillatorNode(audioContext)
		this.oscillator.connect(this.audioNode)
		this.oscillator.start()

		Object.defineProperty(this.audioNode, 'frequency', {
			value: this.oscillator.frequency,
			enumerable: true,
			configurable: true,
			writable: false,
		})

		this.makeParamObservable('gain')
		this.makeParamObservable('frequency')
		if (this.onAudioNode) {
			this.onAudioNode()
			delete this.onAudioNode
		}
	}

	updateSetting(name) {
		if(name === 'type') {
			this.oscillator.type = this.data.settings.type
		} else if(name === 'frequency') {
			this.oscillator.frequency.value = this.data.settings.frequency
		} else if(name === 'gain') {
			this.audioNode.gain.value = this.data.settings.gain
		}
	}
}