import GraphAudioNode from "./GraphAudioNode"

export default class ToMono extends GraphAudioNode {
	static type = 'to-mono'
	static image = `${process.env.PUBLIC_URL}/icons/to-mono.svg`

	static structure = {
		slots: [
			{type: 'input', name: 0},
			{type: 'output', name: 0},
		],
	}

	static requiredModules = [
		`${process.env.PUBLIC_URL}/AudioWorklets/ToMono.js`
	]

	initializeAudioNodes(audioContext) {
		this.audioNode = new AudioWorkletNode(audioContext, 'to-mono')
	}

	updateSetting(name) {
		
	}
}