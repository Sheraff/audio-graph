import GraphAudioNode from "./GraphAudioNode"
import { defaultWaveforms, periodicWaveFromType, waveforms } from "./utils/wave-forms"

/** 
 * @param {number} note 
 * @param {number} octave 
 */
function noteToFrequency(note, octave) {
	const midi = Number(note) + (Number(octave) * 12)
	const frequency = 440 * Math.pow(2, (midi - 69) / 12)
	return frequency
}

export default class NoteOscillator extends GraphAudioNode {
	static type = 'note'
	static image = `${process.env.PUBLIC_URL}/icons/note.svg`
	static isSink = false
	static requiresSinkToPlay = false
	static structure = {
		slots: [
			{type: 'setting', name: 'detune'},
			{type: 'output', name: 0},
		],
		settings: [
			{
				name: 'chord',
				type: 'piano',
				props: {
					size: 24
				},
				defaultValue: [12, 19],
				readFrom: 'piano'
			},
			{
				name: 'detune',
				type: 'range',
				props: {
					min: -4800,
					max: 4800,
					step: 100,
				},
				defaultValue: -2400,
				readFrom: 'value',
			},
			{
				name: 'type',
				type: 'select',
				options: [...defaultWaveforms, ...waveforms],
				defaultValue: "sawtooth",
				readFrom: 'value',
			}
		]
	}

	static requiredModules = []

	createOscillatorChunk(audioContext, offset = 0, detuneNode) {
		const merger = new ChannelMergerNode(audioContext, {numberOfInputs: 6})
		for (let i = 0; i < 6; i++) {
			const index = offset + i
			const gain = new GainNode(audioContext, {gain: 0})
			gain.connect(merger, 0, 0)
			gain.connect(merger, 0, 1)
			this.allGain.push(gain)
			const oscillator = new OscillatorNode(audioContext, {frequency: noteToFrequency(index, 5)})
			oscillator.start()
			oscillator.connect(gain)
			detuneNode.connect(oscillator.detune)
			this.allOscillators.push(oscillator)
		}
		return merger
	}

	initializeAudioNodes(audioContext) {
		this.allGain = []
		this.allOscillators = []
		const detuneNode = new ConstantSourceNode(audioContext, {offset: 0})
		detuneNode.start()
		const halfOctave1 = this.createOscillatorChunk(audioContext, 0, detuneNode)
		const halfOctave2 = this.createOscillatorChunk(audioContext, 6, detuneNode)
		const halfOctave3 = this.createOscillatorChunk(audioContext, 12, detuneNode)
		const halfOctave4 = this.createOscillatorChunk(audioContext, 18, detuneNode)
		this.audioNode = new ChannelMergerNode(audioContext, {numberOfInputs: 4})

		halfOctave1.connect(this.audioNode, 0, 0)
		halfOctave1.connect(this.audioNode, 0, 1)
		halfOctave2.connect(this.audioNode, 0, 0)
		halfOctave2.connect(this.audioNode, 0, 1)
		halfOctave3.connect(this.audioNode, 0, 0)
		halfOctave3.connect(this.audioNode, 0, 1)
		halfOctave4.connect(this.audioNode, 0, 0)
		halfOctave4.connect(this.audioNode, 0, 1)

		Object.defineProperty(this.audioNode, 'detune', {
			value: detuneNode.offset,
			enumerable: true,
			configurable: true,
		})
		this.makeParamObservable('detune')
	}

	updateSetting(name) {
		if(name === 'type') {
			const type = this.data.settings.type
			if (defaultWaveforms.includes(type)) {
				this.allOscillators.forEach((oscillatorNode) => {
					oscillatorNode.type = this.data.settings.type
				})
			} else {
				this.onSelect(type)
			}
		} else if(name === 'detune') {
			this.audioNode.detune.value = parseFloat(this.data.settings.detune)
		} else if(name === 'chord') {
			this.allGain.forEach((gainNode, i) => {
				const value = this.data.settings.chord.includes(i) ? 0.1 : 0
				gainNode.gain.setTargetAtTime(value, this.audioContext.currentTime, 0.015)
			})
		}
	}

	async onSelect(type) {
		const waveform = await periodicWaveFromType(this.audioContext, type)
		if (type === this.data.settings.type) {
			this.allOscillators.forEach((oscillatorNode) => {
				oscillatorNode.setPeriodicWave(waveform)
			})
		}
	}
}