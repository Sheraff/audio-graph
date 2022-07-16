class Multiplier extends AudioWorkletProcessor {
	static get parameterDescriptors () {
		return [{
			name: 'multiplier',
			defaultValue: 1,
			minValue: -1000,
			maxValue: 1000,
			automationRate: 'a-rate'
		}]
	}

	process ([input], [output], parameters) {
		const isAutomatedParam = parameters.multiplier.length > 1
		output.forEach((channel, chIndex) => {
			const inputChannel = input[chIndex]
			for (let i = 0; i < channel.length; i++) {
				if (!inputChannel) {
					channel[i] = 0
					continue
				}
				const multiplier = isAutomatedParam ? parameters.multiplier[i] : parameters.multiplier[0]
				channel[i] = inputChannel[i] * multiplier
			}
		})
		return true
	}
}
	
registerProcessor('multiplier', Multiplier)