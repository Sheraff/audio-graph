import GraphAudioNode from "./GraphAudioNode"

const structure = {
	slots: [
		{type: 'input', name: 0},
		{type: 'output', name: 0},
	],
	settings: {
		fftSize: {
			type: 'range',
			props: {
				min: 5,
				max: 15,
				step: 1,
			},
			defaultValue: 12,
			readFrom: 'value',
		},
		maxDecibels: {
			type: 'range',
			props: {
				min: -500,
				max: 0,
				step: 1,
			},
			defaultValue: -5,
			readFrom: 'value',
		},
		minDecibels: {
			type: 'range',
			props: {
				min: -500,
				max: 0,
				step: 1,
			},
			defaultValue: -200,
			readFrom: 'value',
		},
		smoothingTime: {
			type: 'range',
			props: {
				min: 0,
				max: 1,
				step: 0.01,
			},
			defaultValue: 0.5,
			readFrom: 'value',
		},
		type: {
			type: 'select',
			options: [
				"fourrier",
				"oscilloscope",
			],
			defaultValue: "oscilloscope",
			readFrom: 'value',
		},
	},
	extras: [
		{type: 'analyser', name: 0}
	]
}
export default class Analyser extends GraphAudioNode<
	AnalyserNode,
	typeof structure
> {
	static {
		this.type = 'analyser'
		this.image = `${process.env.PUBLIC_URL}/icons/analyser.svg`
		this.isSink = true
		this.requiresSinkToPlay = false
		this.structure = structure

		this.requiredModules = []
	}

	initializeAudioNodes(audioContext: AudioContext) {
		this.audioNode = new AnalyserNode(audioContext)
	}

	updateSetting(name: keyof typeof structure['settings']) {
		const audioNode = this.audioNode as AnalyserNode
		if (name === 'fftSize') {
			audioNode.fftSize = 2**Number(this.data.settings.fftSize)
		} else if (name === 'minDecibels' || name === 'maxDecibels') {
			audioNode.minDecibels = Math.min(Number(this.data.settings.minDecibels), Number(this.data.settings.maxDecibels) - 1)
			audioNode.maxDecibels = Math.max(Number(this.data.settings.minDecibels) + 1, Number(this.data.settings.maxDecibels))
		} else if (name === 'smoothingTime') {
			audioNode.smoothingTimeConstant = Number(this.data.settings.smoothingTime)
		}
	}
}
