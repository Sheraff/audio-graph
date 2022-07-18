import GraphAudioNode from "./GraphAudioNode"

export default class Delay extends GraphAudioNode {
	static type = 'delay'
	static image = `${process.env.PUBLIC_URL}/icons/delay.svg`

	static structure = {
		slots: [
			{type: 'input', name: 0},
			{type: 'output', name: 0},
			{type: 'setting', name: 'delayTime'},
		],
		settings: [
			{
				name: 'delayTime',
				type: 'range',
				props: {
					min: 0,
					max: 1,
					step: 0.001,
				},
				defaultValue: 0,
				readFrom: 'value',
			},
		]
	}

	static requiredModules = []

	initializeAudioNodes(audioContext) {
		this.audioNode = new DelayNode(audioContext)
	}

	updateSetting(name) {
		if (name === 'delayTime') {
			this.audioNode.delayTime.value = this.data.settings.delayTime
		}
	}
}