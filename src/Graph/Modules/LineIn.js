import GraphAudioNode from "./GraphAudioNode"

export default class LineIn extends GraphAudioNode {
	static type = 'line-in'
	static image = `${process.env.PUBLIC_URL}/icons/line-in.svg`
	static isSink = false
	static requiresSinkToPlay = false
	static structure = {
		slots: [
			{type: 'output', name: 0},
		],
		settings: [],
		extras: [
			{
				type: 'text',
				name: 'warning',
				text: 'put on headphones to avoid feedback',
			}
		]
	}

	static requiredModules = []

	initializeAudioNodes(audioContext) {
		this.audioNode = new GainNode(audioContext)

		navigator.mediaDevices
			.getUserMedia({ audio: true, video: false })
			.then(this.onMediaStream.bind(this))
	}

	updateSetting(name) {
	}

	onMediaStream(mediaStream) {
		this.customNodes.source = new MediaStreamAudioSourceNode(this.audioContext, {
			mediaStream,
		})
		this.customNodes.source.connect(this.audioNode)
	}
}