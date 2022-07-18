import GraphAudioNode from "./GraphAudioNode"

export default class Multiplier extends GraphAudioNode {
	static type = 'multiplier'
	static image = `${process.env.PUBLIC_URL}/icons/multiplier.svg`

	static structure = {
		slots: [
			{type: 'input', name: 0},
			{type: 'input', name: 1},
			{type: 'output', name: 0},
			{type: 'setting', name: 'multiplier'},
		],
		settings: [
			{
				name: 'multiplier',
				type: 'range',
				props: {
					min: -1000,
					max: 1000,
					step: 0.1,
				},
				defaultValue: 1,
				readFrom: 'value',
			},
		]
	}

	static requiredModules = [
		`${process.env.PUBLIC_URL}/AudioWorklets/Multiply.js`
	]

	initializeAudioNodes(audioContext) {
		this.audioNode = new AudioWorkletNode(audioContext, 'multiplier', {numberOfInputs: 2})
	}

	updateSetting(name) {
		if (name === 'multiplier') {
			this.audioNode.parameters.get('multiplier').value = parseFloat(this.data.settings.multiplier)
		}
	}
}