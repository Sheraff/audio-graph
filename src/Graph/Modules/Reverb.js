import GraphAudioNode from "./GraphAudioNode"

export default class Reverb extends GraphAudioNode {
	static type = 'reverb'
	static image = `${process.env.PUBLIC_URL}/icons/reverb.svg`

	static structure = {
		slots: [
			{type: 'input', name: 0},
			{type: 'output', name: 0},
		],
		settings: [
			{
				name: 'duration',
				type: 'range',
				props: {
					min: 0,
					max: 20,
					step: 0.1,
				},
				defaultValue: 0.8,
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
				defaultValue: 0.1,
				readFrom: 'value',
				event: 'change',
			}
		]
	}

	static requiredModules = []

	initializeAudioNodes(audioContext) {
		this.audioNode = new ConvolverNode(audioContext)

		this.impulseResponseWorkerController = new AbortController()
		this.impulseResponseWorker = new Worker(`${process.env.PUBLIC_URL}/Workers/impulseResponse.worker.js`)
		this.impulseResponseWorker.addEventListener(
			'message',
			this.onWorkerResponse.bind(this),
			{signal: this.impulseResponseWorkerController.signal}
		)
	}

	updateSetting(name) {
		if (name === 'duration' || name === 'decay') {
			this.updateConvolverBuffer()
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

		this.audioNode.buffer = impulse
	}

	cleanup() {
		this.impulseResponseWorkerController.abort()
		super.cleanup()
	}
}