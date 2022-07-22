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
				name: 'maxDecibels',
				type: 'range',
				props: {
					min: -500,
					max: 0,
					step: 1,
				},
				defaultValue: -5,
				readFrom: 'value',
			},
			{
				name: 'minDecibels',
				type: 'range',
				props: {
					min: -500,
					max: 0,
					step: 1,
				},
				defaultValue: -200,
				readFrom: 'value',
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
		],
		extras: [
			{type: 'analyser', name: 0}
		]
	}

	static requiredModules = []

	initializeAudioNodes(audioContext) {
		this.audioNode = new AnalyserNode(audioContext)
		if (this.onAudioNode) {
			this.onAudioNode()
			delete this.onAudioNode
		}
	}

	updateSetting(name) {
		if (name === 'fftSize') {
			this.audioNode.fftSize = 2**Number(this.data.settings.fftSize)
		} else if (name === 'minDecibels' || name === 'maxDecibels') {
			this.audioNode.minDecibels = Math.min(this.data.settings.minDecibels, this.data.settings.maxDecibels - 1)
			this.audioNode.maxDecibels = Math.max(this.data.settings.minDecibels + 1, this.data.settings.maxDecibels)
		} else if (name === 'smoothingTime') {
			this.audioNode.smoothingTimeConstant = this.data.settings.smoothingTime
		}
	}
}
