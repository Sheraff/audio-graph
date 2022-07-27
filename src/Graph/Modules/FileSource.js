import { deleteBufferFromIndexedDB, retrieveBufferFromIndexedDB, storeBufferInIndexedDB } from "../Database/utils"
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
			retrieveBufferFromIndexedDB(this.data.settings.buffer)
				.then(data => {
					const array = new Uint8Array(data)
					const buffer = array.buffer
					this.onBuffer(buffer)
				})
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

	/** @param {ProgressEvent<FileReader>} event */
	onFile(event) {
		if (!event.target?.result) {
			console.error('could not read file')
		}
		const buffer = /** @type {ArrayBuffer} */(event.target.result)
		
		// store buffer in indexedDB
		storeBufferInIndexedDB(this.id, [...new Uint8Array(buffer)])
		this.data.settings.buffer = this.id

		this.saveToLocalStorage()
		this.onBuffer(buffer)
	}

	async onBuffer(buffer) {
		const audioData = await this.audioContext.decodeAudioData(buffer)
		this.buffer = audioData
		this.connectBuffer()
	}

	destroy() {
		super.destroy()
		deleteBufferFromIndexedDB(this.id)
	}
}