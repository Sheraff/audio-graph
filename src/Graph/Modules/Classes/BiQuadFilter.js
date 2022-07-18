import GraphAudioNode from "./GraphAudioNode"

export default class BiQuadFilter extends GraphAudioNode {
	static type = 'biquadFilter'
	static image = `${process.env.PUBLIC_URL}/icons/biquadFilter.svg`

	static structure = {
		slots: [
			{type: 'input', name: 0},
			{type: 'output', name: 0},
			{type: 'setting', name: 'frequency'},
			{type: 'setting', name: 'Q'},
			{type: 'setting', name: 'gain'},
		],
		settings: [
			{
				name: 'frequency',
				type: 'range',
				props: {
					min: 20,
					max: 20000,
					step: 1,
				},
				defaultValue: 440,
				readFrom: 'value',
			},
			{
				name: 'type',
				type: 'select',
				props: {
				},
				options: [
					"lowpass",
					"highpass",
					"bandpass",
					"lowshelf",
					"highshelf",
					"peaking",
					"notch",
					"allpass",
				],
				defaultValue: "lowpass",
				readFrom: 'value',
			},
			{
				name: 'Q',
				type: 'range',
				props: {
					min: 0.0001,
					max: 1000,
					step: 0.0001,
				},
				defaultValue: 1,
				readFrom: 'value',
			},
			{
				name: 'gain',
				type: 'range',
				props: {
					min: 0,
					max: 2,
					step: 0.01,
				},
				defaultValue: 1,
				readFrom: 'value',
			}
		]
	}

	static requiredModules = []

	initializeAudioNodes(audioContext) {
		this.audioNode = audioContext.createBiquadFilter()
	}

	updateSetting(name) {
		if (name === 'frequency') {
			this.audioNode.frequency.value = this.data.settings.frequency
		} else if (name === 'Q') {
			this.audioNode.Q.value = this.data.settings.Q
		} else if (name === 'gain') {
			this.audioNode.gain.value = this.data.settings.gain
		}
	}
}