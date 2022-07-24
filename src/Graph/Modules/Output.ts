import GraphAudioNode from "./GraphAudioNode"

export default class Output extends GraphAudioNode {
	static {
		this.type = 'output'
		this.image = `${process.env.PUBLIC_URL}/icons/output.svg`
		this.isSink = true
		this.requiresSinkToPlay = false
		this.structure = {
			slots: [
				{type: 'input', name: 0},
			],
		}
	
		this.requiredModules = []
	}

	initializeAudioNodes(audioContext: AudioContext) {
		this.audioNode = audioContext.destination
	}

	updateSetting() {}
}