import GraphAudioNode from "./GraphAudioNode"

const impulseResponses = [
	'backslap',
	'binaural',
	'comb saw 1',
	'comb saw 2',
	'cosmic ping long',
	'diffusor',
	'echo chamber',
	'feedback spring',
	'filter hipass 5000',
	'filter lopass 160',
	'filter rhythm',
	'filter telephone',
	'fluttery peculiar backwards',
	'kitchen true stereo',
	'matrix reverb 2',
	'matrix reverb 3',
	'matrix reverb 6 backwards',
	'matrix reverb 6',
	'noise spreader',
	'sifter',
	'spatialized backwards',
	'spatialized cosmic',
	'spatialized dark cathedral',
	'spatialized huge spacious 1',
	'spatialized huge spacious 2',
	'spatialized medium open 1',
	'spatialized medium open 2',
	'spatialized outside 1',
	'spatialized outside 2',
	'spreader 50 65ms',
	'tim stretch 2',
	'tim warehouse stretch 1',
	'warehouse cardiod 35 10 spread',
	'warehouse cardiod rear 35 10',
	'warehouse cardiod true stereo 15 8',
	'warehouse omni 35 10',
	'warehouse super ceiling 35 10',
	'wild echo',
]

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
				defaultValue: 1,
				readFrom: 'value',
			},
			{
				name: 'buffer',
				type: 'select',
				options: impulseResponses,
				defaultValue: 'binaural',
				readFrom: 'value',
			}
		]
	}

	static requiredModules = [
		`${process.env.PUBLIC_URL}/AudioWorklets/InputAdd.js`,
	]

	initializeAudioNodes(audioContext) {
		this.customNodes.input = new GainNode(audioContext)
		this.audioNode = new AudioWorkletNode(audioContext, 'add-inputs', {numberOfInputs: 2, processorOptions: {method: 'average'}})
		this.customNodes.input.connect(this.audioNode)
		
		
		this.customNodes.convolver = new ConvolverNode(audioContext)
		this.customNodes.gain = new GainNode(audioContext)
		this.customNodes.input.connect(this.customNodes.convolver)
		this.customNodes.convolver.connect(this.customNodes.gain, 0, 0)
		this.customNodes.gain.connect(this.audioNode, 0, 1)

		Object.defineProperty(this.audioNode, 'wet', {
			value: this.customNodes.gain.gain,
			enumerable: true,
			configurable: true,
		})
		this.makeParamObservable('wet')
	}

	updateSetting(name) {
		if (name === 'buffer') {
			this.updateConvolverBuffer(this.data.settings.buffer)
		} else if (name === 'wet') {
			this.audioNode.wet.value = this.data.settings.wet
		}
	}

	async updateConvolverBuffer(type) {
		const response = await fetch(`${process.env.PUBLIC_URL}/impulse-responses/${type}.wav`)
		const arrayBuffer = await response.arrayBuffer()
		const buffer = await this.audioContext.decodeAudioData(arrayBuffer)
		if (type === this.data.settings.buffer) {
			this.customNodes.convolver.buffer = buffer
		}
	}
}