import GraphAudioNode from "./GraphAudioNode"
import { defaultWaveforms, periodicWaveFromType, waveforms } from "./utils/wave-forms"



export default class Oscillator extends GraphAudioNode {
	static type = 'oscillator'
	static image = `${process.env.PUBLIC_URL}/icons/oscillator.svg`
	static isSink = false
	static requiresSinkToPlay = false
	static structure = {
		slots: [
			{type: 'setting', name: 'frequency'},
			{type: 'setting', name: 'detune'},
			{type: 'output', name: 0},
		],
		settings: [
			{
				name: 'frequency',
				type: 'range',
				props: {
					min: 10,
					max: 880,
					step: 1,
				},
				defaultValue: 440,
				readFrom: 'value',
			},
			{
				name: 'detune',
				type: 'range',
				props: {
					min: -4800,
					max: 4800,
					step: 100,
				},
				defaultValue: 0,
				readFrom: 'value',
			},
			{
				name: 'type',
				type: 'select',
				options: [...defaultWaveforms, ...waveforms],
				defaultValue: "sine",
				readFrom: 'value',
			}
		]
	}

	static requiredModules = []

	initializeAudioNodes(audioContext) {
		this.audioNode = new GainNode(audioContext, {gain: 0.1})

		this.customNodes.oscillator = new OscillatorNode(audioContext)
		this.customNodes.oscillator.connect(this.audioNode)
		this.customNodes.oscillator.start()

		Object.defineProperty(this.audioNode, 'frequency', {
			value: this.customNodes.oscillator.frequency,
			enumerable: true,
			configurable: true,
		})
		Object.defineProperty(this.audioNode, 'detune', {
			value: this.customNodes.oscillator.detune,
			enumerable: true,
			configurable: true,
		})

		this.makeParamObservable('frequency')
		this.makeParamObservable('detune')
	}

	updateSetting(name) {
		if(name === 'type') {
			const type = this.data.settings.type
			if (defaultWaveforms.includes(type)) {
				this.customNodes.oscillator.type = type
			} else {
				this.onSelect(type)
			}
		} else if(name === 'frequency') {
			this.customNodes.oscillator.frequency.value = this.data.settings.frequency
		} else if(name === 'detune') {
			this.customNodes.oscillator.detune.value = parseFloat(this.data.settings.detune)
		}
	}

	async onSelect(type) {
		const waveform = await periodicWaveFromType(this.audioContext, type)
		if (type === this.data.settings.type) {
			this.customNodes.oscillator.setPeriodicWave(waveform)
		}
	}
}