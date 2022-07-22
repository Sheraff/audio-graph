import GraphAudioNode from "./GraphAudioNode"

export default class Wobble extends GraphAudioNode {
	static type = 'pitch-wobble'
	static image = `${process.env.PUBLIC_URL}/icons/pitch-wobble.svg`
	static isSink = false
	static requiresSinkToPlay = false
	static structure = {
		slots: [
			{type: 'input', name: 0},
			{type: 'output', name: 0},
			{type: 'setting', name: 'frequency'},
		],
		settings: [
			{
				name: 'frequency',
				type: 'range',
				props: {
					min: 0.01,
					max: 10,
					step: 0.01,
				},
				defaultValue: 1,
				readFrom: 'value',
			},
			{
				name: 'amplitude',
				type: 'range',
				props: {
					min: 0,
					max: 10,
					step: 0.1,
				},
				defaultValue: 1,
				readFrom: 'value',
			},
		]
	}

	static requiredModules = []

	initializeAudioNodes(audioContext) {
		this.audioNode = new DelayNode(audioContext)
		this.customNodes.frequency = new OscillatorNode(audioContext)
		this.customNodes.amplitude = new GainNode(audioContext)
		this.customNodes.frequency.connect(this.customNodes.amplitude)
		this.customNodes.amplitude.connect(this.audioNode.delayTime)
		this.customNodes.frequency.start()

		Object.defineProperty(this.audioNode, 'frequency', {
			value: this.customNodes.frequency.frequency,
			enumerable: true,
		})
	}

	updateSetting(name) {
		if (name === 'amplitude') {
			const value = Number(this.data.settings.amplitude) / 1000
			this.audioNode.delayTime.value = value
			this.customNodes.amplitude.gain.value = value
		} else if (name === 'frequency') {
			const value = Number(this.data.settings.frequency)
			this.customNodes.frequency.frequency.value = value
		}
	}
}