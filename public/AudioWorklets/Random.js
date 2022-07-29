/* eslint-disable no-labels */

class Random extends AudioWorkletProcessor {
	static get parameterDescriptors () {
		return [
			{
				name: 'variability',
				defaultValue: 10,
				minValue: 0,
				maxValue: 100,
				automationRate: 'k-rate'
			},
			{
				name: 'rate',
				defaultValue: 60,
				minValue: 0,
				maxValue: 300,
				automationRate: 'k-rate'
			},
			{
				name: 'min',
				defaultValue: 0,
				minValue: -100,
				maxValue: 100,
				automationRate: 'k-rate'
			},
			{
				name: 'max',
				defaultValue: 1,
				minValue: -100,
				maxValue: 100,
				automationRate: 'k-rate'
			},
		]
	}
	constructor(options) {
		super(options)
		this.sampleRate = options.processorOptions.sampleRate
		this.sinceLast = 0
		this.nextChange = 0
		this.currentValue = 0
	}
	process (inputs, outputs, parameters) {
		const base = outputs[0][0]
		if (!base) {
			return true
		}
		const rate = parameters.rate[0]
		const variability = parameters.variability[0]
		base.forEach((_,i) => {
			this.sinceLast += 1 / this.sampleRate
			if (this.sinceLast >= this.nextChange) {
				const frameMin = parameters.min[0]
				const frameMax = parameters.max[0]
				const min = Math.min(frameMin, frameMax)
				const max = Math.max(frameMin, frameMax)
				this.currentValue = Math.random() * (max - min) + min
				this.sinceLast = 0

				this.scheduleNextChange(rate, variability)
			} else if (
				this.lastRate !== rate
				|| this.lastVariability !== variability
			) {
				this.scheduleNextChange(rate, variability)
				this.nextChange -= this.sinceLast
			}

			outputs.forEach(output => 
				output.forEach(channel => 
					channel[i] = this.currentValue
				)
			)
		})
		return true
	}

	scheduleNextChange(rate, _variability) {
		const variability = rate * _variability / 100
		const start = 60 / (rate + variability)
		const end = 60 / Math.max(1, (rate - variability))
		this.nextChange = Math.random() * (end - start) + start
		this.lastRate = rate
		this.lastVariability = _variability
	}
}

registerProcessor('random', Random)