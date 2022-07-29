/* eslint-disable no-labels */

class Random extends AudioWorkletProcessor {
	static get parameterDescriptors () {
		return [
			{
				name: 'variability',
				defaultValue: 10,
				minValue: 0,
				maxValue: 100,
				automationRate: 'a-rate'
			},
			{
				name: 'rate',
				defaultValue: 60,
				minValue: 0,
				maxValue: 300,
				automationRate: 'a-rate'
			},
			{
				name: 'min',
				defaultValue: 0,
				minValue: -100,
				maxValue: 100,
				automationRate: 'a-rate'
			},
			{
				name: 'max',
				defaultValue: 1,
				minValue: -100,
				maxValue: 100,
				automationRate: 'a-rate'
			},
		]
	}
	constructor(options) {
		super(options)
		this.sampleRate = options.processorOptions.sampleRate
		this.sinceLast = Infinity
		this.currentValue = 0
	}
	process (inputs, outputs, parameters) {
		const base = outputs[0][0]
		if (!base) {
			return true
		}
		base.forEach((_,i) => {
			this.sinceLast += 1 / this.sampleRate
			changeValue: {
				const frameRate = parameters.rate[i] ?? parameters.rate[0]
				const frameVariability = parameters.variability[i] ?? parameters.variability[0]

				if (frameRate === 0)
					break changeValue

				const variability = frameRate * frameVariability / 100
				const start = 60 / (frameRate + variability)

				if (this.sinceLast <= start)
					break changeValue

				let shouldChange = false
				const end = 60 / Math.max(1, (frameRate - variability))
				if (start === end || this.sinceLast >= end) {
					shouldChange = true
				} else {
					const progress = (this.sinceLast - start) / (end - start)
					shouldChange = Math.random() < progress**4
				}
				if (shouldChange) {
					const frameMin = parameters.min[i] ?? parameters.min[0]
					const frameMax = parameters.max[i] ?? parameters.max[0]
					const min = Math.min(frameMin, frameMax)
					const max = Math.max(frameMin, frameMax)
					this.currentValue = Math.random() * (max - min) + min
					this.sinceLast = 0
				}
			}

			outputs.forEach(output => 
				output.forEach(channel => 
					channel[i] = this.currentValue
				)
			)
		})
		return true
	}
}

registerProcessor('random', Random)