import GraphAudioNode from "./GraphAudioNode"

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

		this.addEventListener('connection-status-change', () => {
			if (this.hasAudioDestination && this.buffer) {
				this.connectBuffer()
				return
			}
			if (!this.hasAudioDestination && this.bufferNode) {
				this.bufferNode.stop(this.audioContext.currentTime)
				this.startTime = null
				this.bufferNode.disconnect(this.audioNode)
				this.bufferNode = null
			}
		}, {signal: this.controller.signal})
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
		} else if (name === 'playbackRate' && this.bufferNode) {
			this.connectBuffer()
		} else if (name === 'tempo' && this.bufferNode) {
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

	connectBuffer(){
		if (this.bufferNode) {
			this.bufferNode.disconnect(this.audioNode)
			this.bufferNode = null
		}
		if (!this.buffer || !this.hasAudioDestination) {
			return
		}
		this.bufferNode = new AudioBufferSourceNode(this.audioContext)
		this.bufferNode.buffer = this.buffer
		this.bufferNode.connect(this.audioNode)

		const {loopStart, loopEnd, startTime, loop, stopTime} = this.computePlaybackParameters()

		this.bufferNode.start(startTime, loopStart)
		this.bufferNode.loop = loop
		if (loop) {
			this.bufferNode.loopStart = loopStart
			this.bufferNode.loopEnd = loopEnd
		} else {
			this.bufferNode.stop(stopTime)
		}

		this.startTime = startTime

		this.bufferNode.playbackRate.value = this.data.settings.playbackRate
	}

	computePlaybackParameters() {
		this.bufferEndedController?.abort()
		const duration = this.buffer.duration
		const bounds = this.data.settings.select
		const loopStart = bounds[0] * duration
		const loopEnd = bounds[1] * duration
		const playbackRate = Number(this.data.settings.playbackRate)

		if (!this.data.settings.tempo.enabled) {
			return {
				loopStart,
				loopEnd,
				startTime: this.audioContext.currentTime,
				loop: true
			}
		}

		const beatLength = 60 / this.data.settings.tempo.value
		const boundedDuration = (loopEnd - loopStart) / playbackRate
		const timeInCurrentBeat = this.audioContext.currentTime % beatLength
		const nextStartOnBeat = timeInCurrentBeat === 0
			? this.audioContext.currentTime
			: this.audioContext.currentTime - timeInCurrentBeat + beatLength
		
		if (boundedDuration >= beatLength) {
			const boundedLoopEnd = loopStart + beatLength * playbackRate
			return {
				loopStart,
				loopEnd: boundedLoopEnd,
				startTime: nextStartOnBeat,
				loop: true,
			}
		}

		this.bufferEndedController = new AbortController()
		this.bufferNode?.addEventListener(
			'ended',
			() => this.connectBuffer(),
			{once: true, signal: this.bufferEndedController.signal}
		)

		return {
			loopStart,
			startTime: nextStartOnBeat,
			loop: false,
			stopTime: nextStartOnBeat + boundedDuration
		}
	}
}