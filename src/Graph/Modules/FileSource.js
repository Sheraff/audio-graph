import GraphAudioNode from "./GraphAudioNode"

export default class FileSource extends GraphAudioNode {
	static type = 'file'
	static image = `${process.env.PUBLIC_URL}/icons/file.svg`

	static structure = {
		slots: [
			{type: 'output', name: 0},
		],
		settings: [
			{
				name: 'source',
				type: 'file',
				props: {
					accept: "audio/basic,audio/mpeg,audio/mp4,audio/x-aiff,audio/ogg,audio/vnd.wav",
				},
				defaultValue: '',
				readFrom: 'files',
				event: 'change',
			},
			{
				name: 'select',
				type: 'sequence',
				props: {},
				defaultValue: [0, 1],
				readFrom: 'bounds',
			},
			{
				name: 'playbackRate',
				type: 'range',
				props: {
					min: 0.1,
					max: 5,
					step: 0.1,
				},
				defaultValue: 1,
				readFrom: 'value',
			},
		]
	}

	static requiredModules = []

	/** @param {AudioContext} audioContext */
	initializeAudioNodes(audioContext) {
		this.audioNode = new GainNode(audioContext)
	}

	updateSetting(name) {
		if (name === 'source') {
			const source = this.data.settings.source?.[0]
			if (source && source.constructor === File) {
				const reader = new FileReader()
				reader.onload = this.onFile.bind(this)
				reader.readAsArrayBuffer(source)
			}
		} else if (name === 'select' && this.buffer) {
			this.connectBuffer()
		} else if (name === 'playbackRate' && this.bufferNode) {
			this.connectBuffer()
		}
	}

	updateAudioNodeSettings() {
		if (this.audioContext) {
			this.updateSetting('source')
		}
	}

	async onFile(event) {
		if (!event.target?.result) {
			console.error('could not read file')
		}
		const buffer = event.target.result
		const audioData = await this.audioContext.decodeAudioData(buffer)
		this.buffer = audioData
		this.connectBuffer()
	}

	connectBuffer(){
		if (this.bufferNode) {
			this.bufferNode.disconnect(this.audioNode)
		}
		if (!this.buffer) {
			return
		}
		this.bufferNode = new AudioBufferSourceNode(this.audioContext)
		this.bufferNode.buffer = this.buffer
		this.bufferNode.connect(this.audioNode)

		const duration = this.buffer.duration
		const bounds = this.data.settings.select
		const start = bounds[0] * duration
		const end = bounds[1] * duration

		this.bufferNode.start(this.audioContext.currentTime, start)
		this.bufferNode.loopStart = start
		this.bufferNode.loopEnd = end
		this.bufferNode.loop = true

		this.startTime = this.audioContext.currentTime

		this.bufferNode.playbackRate.value = this.data.settings.playbackRate
	}
}