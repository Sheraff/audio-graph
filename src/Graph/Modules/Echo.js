import GraphAudioNode from "./GraphAudioNode"

export default class Echo extends GraphAudioNode {
	static type = 'echo'
	static image = `${process.env.PUBLIC_URL}/icons/echo.svg`
	static isSink = false
	static requiresSinkToPlay = false
	static structure = {
		slots: [
			{type: 'custom', name: 'input'},
			{type: 'output', name: 0},
			{type: 'setting', name: 'gain'},
		],
		settings: [
			{
				name: 'gain',
				type: 'range',
				props: {
					min: 0,
					max: 0.9,
					step: 0.01,
				},
				defaultValue: 0.3,
				readFrom: 'value',
			},
			{
				name: 'distance',
				type: 'range',
				props: {
					min: 0,
					max: 1,
					step: 0.001,
				},
				defaultValue: 0.2,
				readFrom: 'value',
				event: 'change',
			},
		]
	}

	static requiredModules = [
		`${process.env.PUBLIC_URL}/AudioWorklets/InputAdd.js`,
	]

	initializeAudioNodes(audioContext) {
		this.customNodes.input = new AudioWorkletNode(audioContext, 'add-inputs', {numberOfInputs: 2})
		this.audioNode = new GainNode(audioContext)
		this.customNodes.input.connect(this.audioNode, 0)

		this.customNodes.delay = new DelayNode(audioContext, {delayTime: 0.2})
		this.customNodes.gain = new GainNode(audioContext, {gain: 0.2})

		this.audioNode.connect(this.customNodes.delay)
		this.customNodes.delay.connect(this.customNodes.gain, 0, 0)
		this.customNodes.gain.connect(this.customNodes.input, 0, 1)

		Object.defineProperty(this.audioNode, 'gain', {
			value: this.customNodes.gain.gain,
			enumerable: true,
		})
	}

	updateSetting(name) {
		if (name === 'gain') {
			this.customNodes.gain.gain.value = this.data.settings.gain
		} else if (name === 'distance') {
			this.customNodes.delay.delayTime.value = this.data.settings.distance
		}
	}
}