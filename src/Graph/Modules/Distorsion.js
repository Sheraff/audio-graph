import GraphAudioNode from "./GraphAudioNode"

export default class Distorsion extends GraphAudioNode {
	static type = 'distorsion'
	static image = `${process.env.PUBLIC_URL}/icons/distorsion.svg`
	static isSink = false
	static requiresSinkToPlay = false
	static structure = {
		slots: [
			{type: 'custom', name: 'input'},
			{type: 'output', name: 0},
		],
		settings: [
			{
				name: 'drive',
				type: 'range',
				props: {
					min: 0,
					max: 100,
					step: 0.1,
				},
				defaultValue: 20,
				readFrom: 'value',
			},
		]
	}

	static requiredModules = []

	initializeAudioNodes(audioContext) {
		this.customNodes.input = new WaveShaperNode(audioContext)
		this.audioNode = new GainNode(audioContext, {gain: 1})
		this.customNodes.input.connect(this.audioNode)
	}

	updateSetting(name) {
		if (name === 'drive') {
			const drive = Number(this.data.settings.drive)
			this.customNodes.input.curve = this.makeDistortionCurve(drive)
			const gain = 1 - Math.sqrt((drive / 100) * 0.3) // somewhat flat-sounding gain curve
			this.audioNode.gain.value = gain
		}
	}

	// https://stackoverflow.com/questions/22312841/waveshaper-node-in-webaudio-how-to-emulate-distortion
	makeDistortionCurve(drive) {
		const n_samples = 441 //this.audioContext.sampleRate //256
		const curve = new Float32Array(n_samples)
		curve.forEach((_, i) => {
			const x = i * 2 / n_samples - 1
			curve[i] = (Math.PI + drive) * x / (Math.PI + drive * Math.abs(x))
		})
		return curve
	}
}