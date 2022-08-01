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
				maxValue: 10000,
				automationRate: 'a-rate'
			},
			{
				name: 'min',
				defaultValue: 0,
				minValue: -1000,
				maxValue: 1000,
				automationRate: 'k-rate'
			},
			{
				name: 'max',
				defaultValue: 1,
				minValue: -1000,
				maxValue: 1000,
				automationRate: 'k-rate'
			},
			{
				name: 'smooth',
				defaultValue: 0,
				minValue: 0,
				maxValue: 1,
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
		this.previousValue = 0
	}
	process (inputs, outputs, parameters) {
		const base = outputs[0][0]
		if (!base) {
			return true
		}
		const isSmooth = Boolean(parameters.smooth[0])
		base.forEach((_,i) => {
			const rate = parameters.rate[i] ?? parameters.rate[0]
			const variability = parameters.variability[i] ?? parameters.variability[0]
			this.sinceLast += 1 / this.sampleRate
			if (this.sinceLast >= this.nextChange) {
				const frameMin = parameters.min[0]
				const frameMax = parameters.max[0]
				const min = Math.min(frameMin, frameMax)
				const max = Math.max(frameMin, frameMax)
				this.previousValue = this.currentValue
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

			if (isSmooth) {
				const progress = Math.sin(this.sinceLast / this.nextChange * Math.PI / 2)
				const delta = this.currentValue - this.previousValue
				const value = this.previousValue + progress * delta
				outputs.forEach(output =>
					output.forEach(channel => {
						channel[i] = value
					})
				)
			} else {
				outputs.forEach(output =>
					output.forEach(channel => 
						channel[i] = this.currentValue
					)
				)
			}
		})
		return true
	}

	scheduleNextChange(rate, _variability) {
		const frequency = 60 / rate
		const variability = frequency * _variability / 100
		const start = frequency - variability
		const end = frequency + variability
		this.nextChange = Math.random() * (end - start) + start
		this.lastRate = rate
		this.lastVariability = _variability
	}
}

registerProcessor('random', Random)