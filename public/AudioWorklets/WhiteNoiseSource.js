class WhiteNoiseProcessor extends AudioWorkletProcessor {
	static get parameterDescriptors () {
		return [
			{
				name: 'min',
				defaultValue: 0,
				minValue: 0,
				maxValue: 1,
				automationRate: 'a-rate'
			},
			{
				name: 'max',
				defaultValue: 1,
				minValue: 0,
				maxValue: 1,
				automationRate: 'a-rate'
			},
		]
	}
	process (inputs, outputs, parameters) {
		const output = outputs[0]
		const isAutomatedMin = parameters.min.length > 1
		const isAutomatedMax = parameters.max.length > 1
		output.forEach(channel => {
			for (let i = 0; i < channel.length; i++) {
				const min = isAutomatedMin ? parameters.min[i] : parameters.min[0]
				const max = isAutomatedMax ? parameters.max[i] : parameters.max[0]
				const range = Math.max(0, max - min)
				const random = Math.random() * (range * 2) - range
				channel[i] = Math.sign(random) * min + random
			}
		})
		return true
	}
}
	
registerProcessor('white-noise-processor', WhiteNoiseProcessor)