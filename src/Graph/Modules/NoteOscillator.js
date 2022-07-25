import GraphAudioNode from "./GraphAudioNode"

const defaultWaveforms = [
	'sine',
	'square',
	'sawtooth',
	'triangle',
]

const waveforms = [
	'01_Saw',
	'02_Triangle',
	'03_Square',
	'04_Noise',
	'05_Pulse',
	'06_Warm_Saw',
	'07_Warm_Triangle',
	'08_Warm_Square',
	'09_Dropped_Saw',
	'10_Dropped_Square',
	'11_TB303_Square',
	'Bass',
	'Bass_Amp360',
	'Bass_Fuzz',
	'Bass_Fuzz_ 2',
	'Bass_Sub_Dub',
	'Bass_Sub_Dub_2',
	'Brass',
	'Brit_Blues',
	'Brit_Blues_Driven',
	'Buzzy_1',
	'Buzzy_2',
	'Celeste',
	'Chorus_Strings',
	'Dissonant Piano',
	'Dissonant_1',
	'Dissonant_2',
	'Dyna_EP_Bright',
	'Dyna_EP_Med',
	'Ethnic_33',
	'Full_1',
	'Full_2',
	'Guitar_Fuzz',
	'Harsh',
	'Mkl_Hard',
	'Organ_2',
	'Organ_3',
	'Phoneme_ah',
	'Phoneme_bah',
	'Phoneme_ee',
	'Phoneme_o',
	'Phoneme_ooh',
	'Phoneme_pop_ahhhs',
	'Piano',
	'Putney_Wavering',
	'Throaty',
	'Trombone',
	'Twelve String Guitar 1',
	'Twelve_OpTines',
	'Wurlitzer',
	'Wurlitzer_2',
]

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
				const value = this.data.settings.chord.includes(i) ? 1 : 0
				gainNode.gain.value = value
			})
		}
	}

	async onSelect(type) {
		const url = `${process.env.PUBLIC_URL}/wave-tables/${type}`
		const response = await fetch(url)
		const {real, imag} = await response.json()
		const waveform = this.audioContext.createPeriodicWave(
			new Float32Array(real),
			new Float32Array(imag)
		)
		if (type === this.data.settings.type) {
			this.allOscillators.forEach((oscillatorNode) => {
				oscillatorNode.setPeriodicWave(waveform)
			})
		}
	}
}