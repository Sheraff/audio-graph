import GraphAudioNode from "./GraphAudioNode"

export default class LFO extends GraphAudioNode {
	static type = 'lfo'
	static image = `${process.env.PUBLIC_URL}/icons/lfo.svg`

	static structure = {
		slots: [
			{type: 'setting', name: 'frequency'},
			{type: 'output', name: 0},
		],
		settings:  [
			{
				name: 'frequency',
				type: 'range',
				props: {
					min: 0.01,
					max: 10,
					step: 0.01,
				},
				defaultValue: 0.03,
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
		console.log('update', this.audioNode)
		if(name === 'type') {
			this.audioNode.type = this.data.settings.type
		} else if(name === 'frequency') {
			this.audioNode.frequency.value = this.data.settings.frequency
		}
	}
}