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
		const url = `${process.env.PUBLIC_URL}/wave-tables/${type}`
		const response = await fetch(url)
		const waveTable = await response.json()
		const waveform = new PeriodicWave(this.audioContext, {
			real: new Float32Array(waveTable.real),
			imag: new Float32Array(waveTable.imag)
		})
		if (type === this.data.settings.type) {
			this.customNodes.oscillator.setPeriodicWave(waveform)
		}
	}
}