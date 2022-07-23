import GraphAudioNode from "./GraphAudioNode"

export default class Reverb extends GraphAudioNode {
	static type = 'reverb'
	static image = `${process.env.PUBLIC_URL}/icons/reverb.svg`
	static isSink = false
	static requiresSinkToPlay = false
	static structure = {
		slots: [
			{type: 'custom', name: 'input'},
			{type: 'output', name: 0},
			{type: 'setting', name: 'wet'},
		],
		settings: [
			{
				name: 'wet',
				type: 'range',
				props: {
					min: 0,
					max: 5,
					step: 0.1,
				},
				defaultValue: 4,
				readFrom: 'value',
			},
			{
				name: 'duration',
				type: 'range',
				props: {
					min: 0,
					max: 20,
					step: 0.1,
				},
				defaultValue: 0.5,
				readFrom: 'value',
				event: 'change',
			},
			{
				name: 'decay',
				type: 'range',
				props: {
					min: 0,
					max: 0.5,
					step: 0.01,
				},
				defaultValue: 0.13,
				readFrom: 'value',
				event: 'change',
			}
		]
	}

	static requiredModules = [
		`${process.env.PUBLIC_URL}/AudioWorklets/InputAdd.js`,
	]

	initializeAudioNodes(audioContext) {
		this.customNodes.input = new GainNode(audioContext)
		this.audioNode = new AudioWorkletNode(audioContext, 'add-inputs', {numberOfInputs: 2})
		this.customNodes.input.connect(this.audioNode)
		
		
		this.customNodes.convolver = new ConvolverNode(audioContext)
		this.customNodes.gain = new GainNode(audioContext)
		this.customNodes.input.connect(this.customNodes.convolver)
		this.customNodes.convolver.connect(this.customNodes.gain, 0, 0)
		this.customNodes.gain.connect(this.audioNode, 0, 1)

		this.impulseResponseWorkerController = new AbortController()
		this.impulseResponseWorker = new Worker(`${process.env.PUBLIC_URL}/Workers/impulseResponse.worker.js`)
		this.impulseResponseWorker.addEventListener(
			'message',
			this.onWorkerResponse.bind(this),
			{signal: this.impulseResponseWorkerController.signal}
		)

		Object.defineProperty(this.audioNode, 'wet', {
			value: this.customNodes.gain.gain,
			enumerable: true,
			configurable: true,
		})
		this.makeParamObservable('wet')
	}

	updateSetting(name) {
		if (name === 'duration' || name === 'decay') {
			this.updateConvolverBuffer()
		} else if (name === 'wet') {
			this.customNodes.gain.gain.value = this.data.settings.wet
		}
	}

	updateConvolverBuffer() {
		const duration = this.data.settings.duration
		const decay = this.data.settings.decay
		const sampleRate = this.audioContext.sampleRate
		
		this.impulseResponseWorker.postMessage({
			sampleRate,
			duration,
			decay,
		})
	}

	onWorkerResponse({data: {left, right}}) {
		const sampleRate = this.audioContext.sampleRate
		const length = sampleRate * this.data.settings.duration
		const impulse = this.audioContext.createBuffer(2, length, sampleRate)

		const impulseLeft = new Float32Array(left)
		const impulseRight = new Float32Array(right)
		impulse.copyToChannel(impulseLeft, 0)
		impulse.copyToChannel(impulseRight, 1)

		this.customNodes.convolver.buffer = impulse
	}

	cleanup() {
		this.impulseResponseWorkerController.abort()
		super.cleanup()
	}
}