import GraphAudioNode from "./GraphAudioNode"

export default class WaveShaper extends GraphAudioNode {
	static waveShaperSampleCount = 64
	static type = 'wave-shaper'
	static image = `${process.env.PUBLIC_URL}/icons/wave-shaper.svg`
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
				name: 'shape',
				type: 'wave-shaper',
				defaultValue: Array(WaveShaper.waveShaperSampleCount)
					.fill(0)
					.map(
						(_,i) => Math.sin(i / WaveShaper.waveShaperSampleCount * Math.PI * 2)
					),
				readFrom: 'wave',
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
		if (name === 'shape') {
			const waveTable = dft(this.data.settings.shape)
			const waveform = new PeriodicWave(this.audioContext, waveTable)
			this.customNodes.oscillator.setPeriodicWave(waveform)
		} else if(name === 'frequency') {
			this.customNodes.oscillator.frequency.value = this.data.settings.frequency
		} else if(name === 'detune') {
			this.customNodes.oscillator.detune.value = parseFloat(this.data.settings.detune)
		}
	}
}

// https://gist.github.com/shovon/c3ca8e59a5cf277c947a
function dft(samples) {
	const length = samples.length
	const halfLength = Math.floor(length / 2)
	const waveTable = {
		real: new Float32Array(halfLength),
		imag: new Float32Array(halfLength),
	}
	const pi2 = -Math.PI * 2
	const thetaZero = pi2 / length
	for (let i = 0; i <= halfLength / 2; i++) {
		const partialTheta = thetaZero * i
		for (let n = 0; n < length; n++) {
			const theta = n * partialTheta
			waveTable.real[i] += samples[n] * Math.cos(theta)
			waveTable.imag[i] += samples[n] * Math.sin(theta)
		}
	}
	return waveTable
}