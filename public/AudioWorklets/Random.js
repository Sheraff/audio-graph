class Random extends AudioWorkletProcessor {
	static get parameterDescriptors () {
		return [
			{
				name: 'variability',
				defaultValue: 50,
				minValue: 0,
				maxValue: 44100,
				automationRate: 'a-rate'
			},
			{
				name: 'rate',
				defaultValue: 44100 / 60,
				minValue: 128,
				maxValue: 44100,
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
	constructor(...args) {
		super(...args)
		this.sinceLast = Infinity
		this.currentValue = 0
	}
	process (inputs, outputs, parameters) {
		const base = outputs[0][0]
		if (!base) {
			return true
		}
		base.forEach((_,i) => {
			this.sinceLast += 1
			const variability = parameters.variability[i]
			const rate = parameters.rate[i]
			const start = rate - variability
			if (this.sinceLast > start) {
				let shouldChange = false
				const end = rate + variability
				if (start === end || this.sinceLast >= end) {
					shouldChange = true
				} else {
					const progress = (this.sinceLast - start) / (variability * 2)
					shouldChange = Math.random() < progress**4
				}
				if (shouldChange) {
					const min = Math.min(parameters.min[i], parameters.max[i])
					const max = Math.max(parameters.min[i], parameters.max[i])
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