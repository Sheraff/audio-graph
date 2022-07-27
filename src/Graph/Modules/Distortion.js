import GraphAudioNode from "./GraphAudioNode"
import distortionCurves from "./utils/distortion-curves"

const options = Array.from(Object.keys(distortionCurves))

export default class Distortion extends GraphAudioNode {
	static type = 'distortion'
	static image = `${process.env.PUBLIC_URL}/icons/distortion.svg`
	static isSink = false
	static requiresSinkToPlay = false
	static structure = {
		slots: [
			{type: 'input', name: 0},
			{type: 'output', name: 0},
		],
		settings: [
			{
				name: 'drive',
				type: 'range',
				props: {
					min: 0,
					max: 10,
					step: 0.1,
				},
				defaultValue: 20,
				readFrom: 'value',
			},
			{
				name: 'type',
				type: 'select',
				options: options,
				defaultValue: 'basic',
				readFrom: 'value',
			}
		]
	}

	static requiredModules = []

	initializeAudioNodes(audioContext) {
		this.audioNode = new WaveShaperNode(audioContext)
	}

	updateSetting(name) {
		if (name === 'drive' || name === 'type') {
			const drive = exponentialValueInterpolation(this.data.settings.drive)
			this.audioNode.curve = distortionCurves[this.data.settings.type](drive, this.audioContext.sampleRate / 100)
		}
	}
}

function exponentialValueInterpolation(_value) {
	// value is in [0, 10] range, adjust to [1, 1500] range
	const value = 150 * parseFloat(_value)
	const minp = 0
	const maxp = 1500

	// The result should be between 1 an 1500
	const minv = Math.log(1)
	const maxv = Math.log(1500)

	// calculate adjustment factor
	const scale = (maxv - minv) / (maxp - minp)

	return Math.exp(minv + scale * (value - minp))
}