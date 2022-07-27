import GraphAudioNode from "./GraphAudioNode"
import composeConnectBuffer from "./utils/compose-connect-buffer"

export default class FileSource extends GraphAudioNode {
	static type = 'file'
	static image = `${process.env.PUBLIC_URL}/icons/file.svg`
	static isSink = false
	static requiresSinkToPlay = true
	static structure = {
		slots: [
			{type: 'output', name: 0},
		],
		settings: [
			{
				name: 'select',
				type: 'splice',
				props: {},
				defaultValue: [0, 1],
				readFrom: 'bounds',
			},
			{
				name: 'source',
				type: 'file',
				props: {
					accept: "audio/basic,audio/mpeg,audio/mp4,audio/x-aiff,audio/ogg,audio/vnd.wav,audio/wav",
				},
				defaultValue: '',
				readFrom: 'files',
				event: 'change',
			},
			{
				name: 'playbackRate',
				type: 'range',
				props: {
					min: 0.1,
					max: 5,
					step: 0.01,
				},
				defaultValue: 1,
				readFrom: 'value',
			},
			{
				name: 'tempo',
				type: 'toggle-range',
				props: {
					min: 1,
					max: 300,
					step: 1,
				},
				defaultValue: {enabled: false, value: 60},
				readFrom: 'toggle-value',
			}
		]
	}

	static requiredModules = []

	/** @param {AudioContext} audioContext */
	initializeAudioNodes(audioContext) {
		this.audioNode = new GainNode(audioContext)
		this.startTime = null

		composeConnectBuffer(this)
	}

	updateSetting(name) {
		if (name === 'buffer') {
			const array = new Uint8Array(this.data.settings.buffer)
			const buffer = array.buffer
			this.onBuffer(buffer)
		} else if (name === 'source') {
			const source = this.data.settings.source?.[0]
			if (source && source.constructor === File) {
				const name = source.name
				this.data.settings.source = name
				const reader = new FileReader()
				reader.onload = this.onFile.bind(this)
				reader.readAsArrayBuffer(source)
			}
		} else if (name === 'select' && this.buffer) {
			this.connectBuffer()
		} else if (name === 'playbackRate' && this.customNodes.source) {
			this.connectBuffer()
		} else if (name === 'tempo' && this.customNodes.source) {
			this.connectBuffer()
		}
	}

	updateAudioNodeSettings() {
		if (this.audioContext) {
			if (this.data.settings.buffer)
				this.updateSetting('buffer')
			else
				this.updateSetting('source')
		}
	}

	onFile(event) {
		if (!event.target?.result) {
			console.error('could not read file')
		}
		const buffer = event.target.result
		// TODO: switch to indexedDB?
		if (event.lengthComputable && event.total < 3_000_000) {
			this.data.settings.buffer = [...new Uint8Array(buffer)]
		} else {
			delete this.data.settings.buffer
			delete this.data.settings.source
			console.warn('file is too large to store in localStorage')
		}
		this.saveToLocalStorage()
		this.onBuffer(buffer)
	}

	async onBuffer(buffer) {
		const audioData = await this.audioContext.decodeAudioData(buffer)
		this.buffer = audioData
		this.connectBuffer()
	}
}