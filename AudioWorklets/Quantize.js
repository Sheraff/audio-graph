class Quantize extends AudioWorkletProcessor {
	static get parameterDescriptors () {
		return [
			{
				name: 'step',
				defaultValue: 1,
				minValue: 0.01,
				maxValue: 1000,
				automationRate: 'k-rate'
			},
		]
	}
	process ([input], [output], parameters) {
		if (!input.length || !output.length) return true

		const step = parameters.step[0]

		output.forEach((channel, channelIndex) => {
			const inputChannel = input[channelIndex] || input[channelIndex - 1]
			channel.forEach((_, t) => {
				const quantized = Math.round(inputChannel[t] / step) * step
				channel[t] = quantized
			})
		})
		return true
	}
}

registerProcessor('quantize', Quantize)