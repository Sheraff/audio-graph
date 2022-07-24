import GraphAudioNode from "./GraphAudioNode"

export default class Duplicate extends GraphAudioNode {
	static type = 'duplicate'
	static image = `${process.env.PUBLIC_URL}/icons/duplicate.svg`
	static isSink = false
	static requiresSinkToPlay = false
	static structure = {
		slots: [
			{type: 'input', name: 0},
			{type: 'output', name: 0},
			{type: 'output', name: 1},
			{type: 'output', name: 2},
		],
	}

	static requiredModules = []

	initializeAudioNodes(audioContext) {
		this.audioNode = new GainNode(audioContext)
		this.customNodes[0] = new GainNode(audioContext)
		this.customNodes[1] = new GainNode(audioContext)
		this.customNodes[2] = new GainNode(audioContext)

		this.audioNode.connect(this.customNodes[0])
		this.audioNode.connect(this.customNodes[1])
		this.audioNode.connect(this.customNodes[2])

		Object.defineProperty(this.audioNode, 'connect', {
			value: (destination, output = 0, input) => {
				if(input === undefined)
					this.customNodes[output].connect(destination)
				else
					this.customNodes[output].connect(destination, 0, input)
			},
			enumerable: true,
		})
		Object.defineProperty(this.audioNode, 'disconnect', {
			value: (destination, output = 0, input) => {
				if(input === undefined)
					this.customNodes[output].disconnect(destination)
				else
					this.customNodes[output].disconnect(destination, 0, input)
			},
			enumerable: true,
		})
	}

	updateSetting(name) {
		
	}
}