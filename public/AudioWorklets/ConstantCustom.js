class ConstantCustom extends AudioWorkletProcessor {
	static get parameterDescriptors () {
		return [{
			name: 'offset',
			defaultValue: 1,
			minValue: -10000,
			maxValue: 10000,
			automationRate: 'a-rate'
		}]
	}

	process (inputs, [output], parameters) {
		const isAutomatedParam = parameters.offset.length > 1
		output.forEach((channel) => {
			for (let i = 0; i < channel.length; i++) {
				const offset = isAutomatedParam ? parameters.offset[i] : parameters.offset[0]
				channel[i] = offset
			}
		})
		return true
	}
}
	
registerProcessor('constant-custom', ConstantCustom)