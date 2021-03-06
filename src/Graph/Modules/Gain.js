import GraphAudioNode from "./GraphAudioNode"

export default class Gain extends GraphAudioNode {
	static type = 'gain'
	static image = `${process.env.PUBLIC_URL}/icons/gain.svg`
	static isSink = false
	static requiresSinkToPlay = false
	static structure = {
		slots: [
			{type: 'input', name: 0},
			{type: 'output', name: 0},
			{type: 'setting', name: 'gain'},
		],
		settings: [
			{
				name: 'gain',
				type: 'range',
				props: {
					min: 0,
					max: 10,
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
		this.makeParamObservable('gain')
	}

	updateSetting(name) {
		if (name === 'gain') {
			this.audioNode.gain.value = this.data.settings.gain
		}
	}
}