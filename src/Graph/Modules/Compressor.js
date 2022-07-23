import GraphAudioNode from "./GraphAudioNode"

export default class Compressor extends GraphAudioNode {
	static type = 'compressor'
	static image = `${process.env.PUBLIC_URL}/icons/compressor.svg`
	static isSink = false
	static requiresSinkToPlay = false
	static structure = {
		slots: [
			{type: 'input', name: 0},
			{type: 'output', name: 0},
			{type: 'setting', name: 'threshold'},
			{type: 'setting', name: 'knee'},
			{type: 'setting', name: 'ratio'},
			{type: 'setting', name: 'attack'},
			{type: 'setting', name: 'release'},
		],
		settings: [
			{name: 'threshold', type: 'range', props: {min: -100, max: 0, step: 1}, defaultValue: -10, readFrom: 'value'},
			{name: 'knee', type: 'range', props: {min: 0, max: 40, step: 1}, defaultValue: 10, readFrom: 'value'},
			{name: 'ratio', type: 'range', props: {min: 1, max: 20, step: 1}, defaultValue: 2, readFrom: 'value'},
			{name: 'attack', type: 'range', props: {min: 0, max: 1, step: 0.001}, defaultValue: 0.1, readFrom: 'value'},
			{name: 'release', type: 'range', props: {min: 0, max: 1, step: 0.001}, defaultValue: 0, readFrom: 'value'},
		]
	}

	static requiredModules = []

	initializeAudioNodes(audioContext) {
		this.audioNode = new DynamicsCompressorNode(audioContext)
		this.makeParamObservable('threshold')
		this.makeParamObservable('knee')
		this.makeParamObservable('ratio')
		this.makeParamObservable('attack')
		this.makeParamObservable('release')
		if (this.onAudioNode) {
			this.onAudioNode()
			delete this.onAudioNode
		}
	}

	updateSetting(name) {
		if (name === 'threshold') {
			this.audioNode.threshold.value = this.data.settings.threshold
		} else if (name === 'knee') {
			this.audioNode.knee.value = this.data.settings.knee
		} else if (name === 'ratio') {
			this.audioNode.ratio.value = this.data.settings.ratio
		} else if (name === 'attack') {
			this.audioNode.attack.value = this.data.settings.attack
		} else if (name === 'release') {
			this.audioNode.release.value = this.data.settings.release
		}
	}
}