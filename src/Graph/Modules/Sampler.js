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
				type: 'checkbox',
				defaultValue: false,
				readFrom: 'checked'
			},
			{
				name: 'select',
				type: 'splice',
				defaultValue: [0, 1],
				readFrom: 'bounds',
			},
		]
	}

	static requiredModules = [
		`${process.env.PUBLIC_URL}/AudioWorklets/Recorder.js`
	]

	initializeAudioNodes(audioContext) {
		this.customNodes.input = new GainNode(audioContext)
		this.customNodes.recorder = new AudioWorkletNode(audioContext, 'recorder', {numberOfInputs: 1, outputChannelCount: [2]})
		this.audioNode = new GainNode(audioContext)
		this.customNodes.input.connect(this.audioNode)

		this.customNodes.recorder.port.onmessage = ({data}) => {
			const left = new Float32Array(data.left)
			const right = new Float32Array(data.right)
			this.onBuffer(left, right)
		}

		composeConnectBuffer(this)

		this.isCustomNodeInitialConnected = false
	}

	updateSetting(name, element) {
		if (name === 'record') {
			const record = this.data.settings.record
			if (record) {
				if (this.customNodes.source) {
					this.customNodes.source.stop(this.audioContext.currentTime)
					this.customNodes.source = null
				}
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
				}
				this.customNodes.recorder.port.postMessage({type: 'stop'})
				this.isSink = false
				this.requiresSinkToPlay = true
				element?.dispatchEvent(new CustomEvent('node-type-change', {bubbles: true}))
			}
		}
	}

	onBuffer(left, right) {
		if (this.data.settings.record) {
			return
		}
		this.buffer = new AudioBuffer({
			length: left.length,
			numberOfChannels: 2,
			sampleRate: this.audioContext.sampleRate,
		})
		this.buffer.copyToChannel(left, 0)
		this.buffer.copyToChannel(right, 1)
		this.connectBuffer()
	}
}