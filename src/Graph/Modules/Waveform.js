import GraphAudioNode from "./GraphAudioNode"


export default class Waveform extends GraphAudioNode {
	static type = 'waveform'
	static image = `${process.env.PUBLIC_URL}/icons/waveform.svg`
	static isSink = true
	static requiresSinkToPlay = false
	static structure = {
		slots: [
			{type: 'input', name: 0},
			{type: 'output', name: 0},
		],
		settings: [
			{
				name: 'sample',
				type: 'range',
				props: {
					min: 1,
					max: 2000,
					step: 1,
				},
				defaultValue: 500,
				readFrom: 'value',
			}
		],
		extras: [
			{type: 'waveform', name: 0}
		]
	}

	static requiredModules = []

	initializeAudioNodes(audioContext) {
		this.audioNode = new AnalyserNode(audioContext)
	}

	updateSetting(name) {

	}
}
