import GraphAudioNode from "./GraphAudioNode"

export default class Oscillator extends GraphAudioNode {
	static type = 'oscillator'
	static image = `${process.env.PUBLIC_URL}/icons/oscillator.svg`

	static structure = {
		slots: [
			{type: 'setting', name: 'frequency'},
			{type: 'setting', name: 'detune'},
			{type: 'output', name: 0},
		],
		settings: [
			{
				name: 'frequency',
				type: 'range',
				props: {
					min: 20,
					max: 5000,
					step: 1,
				},
				defaultValue: 440,
				readFrom: 'value',
			},
			{
				name: 'detune',
				type: 'range',
				props: {
					min: -4800,
					max: 4800,
					step: 100,
				},
				defaultValue: 0,
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
			}
		]
	}

	static requiredModules = []

	initializeAudioNodes(audioContext) {
		this.audioNode = new OscillatorNode(audioContext)
		this.audioNode.start()
	}

	updateSetting(name) {
		if(name === 'type') {
			this.audioNode.type = this.data.settings.type
		} else if(name === 'frequency') {
			this.audioNode.frequency.value = this.data.settings.frequency
		} else if(name === 'detune') {
			this.audioNode.detune.value = parseFloat(this.data.settings.detune)
		}
	}
}