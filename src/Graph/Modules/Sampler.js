import { deleteBufferFromIndexedDB, retrieveBufferFromIndexedDB, storeBufferInIndexedDB } from "../Database/utils"
import GraphAudioNode from "./GraphAudioNode"
import composeConnectBuffer from "./utils/compose-connect-buffer"

export default class Sampler extends GraphAudioNode {
	static type = 'sampler'
	static image = `${process.env.PUBLIC_URL}/icons/sampler.svg`
	static isSink = false
	static requiresSinkToPlay = true
	static structure = {
		slots: [
			{type: 'custom', name: 'input'},
			{type: 'output', name: 0},
		],
		settings: [
			{
				name: 'record',
				type: 'record',
				defaultValue: false,
				readFrom: 'checked'
			},
			{
				name: 'select',
				type: 'splice',
				defaultValue: [0, 1],
				readFrom: 'bounds',
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

	static requiredModules = [
		`${process.env.PUBLIC_URL}/AudioWorklets/Recorder.js`
	]

	constructor(...args) {
		super(...args)
		this.isCustomNodeInitialConnected = false
		this.data.settings.record = false
	}

	initializeAudioNodes(audioContext) {
		this.customNodes.input = new GainNode(audioContext)
		this.customNodes.recorder = new AudioWorkletNode(audioContext, 'recorder', {numberOfInputs: 1, outputChannelCount: [2]})
		this.audioNode = new GainNode(audioContext)
		this.customNodes.input.connect(this.audioNode)

		this.customNodes.recorder.port.onmessage = this.onWorklet.bind(this)

		composeConnectBuffer(this)
	}

	updateSetting(name, element) {
		if (name === 'record') {
			const record = this.data.settings.record
			if (record) {
				if (this.customNodes.source) {
					this.customNodes.source.stop(this.audioContext.currentTime)
					this.customNodes.source = null
				}
				this.data.extra.buffer = null
				deleteBufferFromIndexedDB(this.id)
				this.buffer = null
				this.customNodes.recorder.port.postMessage({type: 'start'})
				this.customNodes.input.connect(this.customNodes.recorder)
				this.isCustomNodeInitialConnected = true
				this.isSink = true
				this.requiresSinkToPlay = false
				element?.dispatchEvent(new CustomEvent('node-type-change', {bubbles: true}))
			} else {
				if (this.isCustomNodeInitialConnected) {
					this.customNodes.input.disconnect(this.customNodes.recorder)
					this.customNodes.recorder.port.postMessage({type: 'stop'})
				} else if (this.data.extra.buffer) {
					retrieveBufferFromIndexedDB(this.data.extra.buffer)
						.then(buffer => {
							const leftInt = new Uint32Array(buffer[0])
							const rightInt = new Uint32Array(buffer[1])
							const left = new Float32Array(leftInt.buffer)
							const right = new Float32Array(rightInt.buffer)
							this.onBuffer(left, right)
						})
				}
				this.isSink = false
				this.requiresSinkToPlay = true
				element?.dispatchEvent(new CustomEvent('node-type-change', {bubbles: true}))
			}
		} else if (name === 'select' && this.buffer) {
			this.connectBuffer()
		} else if (name === 'playbackRate' && this.customNodes.source) {
			this.connectBuffer()
		} else if (name === 'tempo' && this.customNodes.source) {
			this.connectBuffer()
		}
	}

	onWorklet({data}) {
		if (this.data.settings.record) {
			return
		}
		const left = new Float32Array(data.left)
		const right = new Float32Array(data.right)
		this.onBuffer(left, right)
		storeBufferInIndexedDB(this.id, [
			[...new Uint32Array(data.left)],
			[...new Uint32Array(data.right)],
		]).then(() => {
			this.data.extra.buffer = this.id
			this.saveToLocalStorage()
		})
	}

	onBuffer(left, right) {
		this.buffer = new AudioBuffer({
			length: left.length,
			numberOfChannels: 2,
			sampleRate: this.audioContext.sampleRate,
		})
		this.buffer.copyToChannel(left, 0)
		this.buffer.copyToChannel(right, 1)
		this.connectBuffer()
	}

	destroy() {
		super.destroy()
		deleteBufferFromIndexedDB(this.id)
	}
}