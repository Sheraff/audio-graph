import GraphAudioNode from "./GraphAudioNode"

export default class Output extends GraphAudioNode {
	static type = 'output'
	static image = `${process.env.PUBLIC_URL}/icons/output.svg`

	static structure = {
		slots: [
			{type: 'input', name: 0},
		],
	}

	static requiredModules = []

	initializeAudioNodes(audioContext) {
		this.audioNode = audioContext.destination
	}

	updateSetting(name) {
		
	}
}