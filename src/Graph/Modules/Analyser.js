import GraphAudioNode from "./GraphAudioNode"


export default class Analyser extends GraphAudioNode {
	static type = 'analyser'
	static image = `${process.env.PUBLIC_URL}/icons/analyser.svg`
	static isSink = true
	static requiresSinkToPlay = false
	static structure = {
		slots: [
			{type: 'input', name: 0},
			{type: 'output', name: 0},
		],
		settings: [
			{
				name: 'fftSize',
				type: 'range',
				props: {
					min: 5,
					max: 15,
					step: 1,
				},
				defaultValue: 12,
				readFrom: 'value',
			},
			{
				name: 'decibels',
				type: 'minmax',
				props: {
					min: -500,
					max: 0,
					step: 1
				},
				defaultValue: [-200, -5],
				readFrom: 'values',
			},
			{
				name: 'smoothingTime',
				type: 'range',
				props: {
					min: 0,
					max: 1,
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
					"fourrier",
					"oscilloscope",
				],
				defaultValue: "oscilloscope",
				readFrom: 'value',
			},
			{
				name: 'focus',
				type: 'minmax',
				props: {
					min: 0,
					max: 100,
					step: 1
				},
				defaultValue: [0, 100],
				readFrom: 'values',
			},
		],
		extras: [
			{type: 'analyser', name: 0}
		]
	}

	static requiredModules = []

	initializeAudioNodes(audioContext) {
		this.audioNode = new AnalyserNode(audioContext)
	}

	updateSetting(name) {
		if (name === 'fftSize') {
			this.audioNode.fftSize = 2**Number(this.data.settings.fftSize)
		} else if (name === 'decibels') {
			this.audioNode.minDecibels = this.data.settings.decibels[0]
			this.audioNode.maxDecibels = this.data.settings.decibels[1]
		} else if (name === 'smoothingTime') {
			this.audioNode.smoothingTimeConstant = this.data.settings.smoothingTime
		}
	}
}
