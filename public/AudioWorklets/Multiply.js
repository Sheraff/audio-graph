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

	process ([a, b], [output], parameters) {
		if (!a?.length && !b?.length)
			return true
		const isAutomatedParam = parameters.multiplier.length > 1
		output.forEach((channel, chIndex) => {
			const aChannel = a[chIndex]
			const bChannel = b[chIndex]
			const channelCount = !!aChannel + !!bChannel
			if (channelCount === 0)
				return
			for (let i = 0; i < channel.length; i++) {
				const aSample = aChannel ? aChannel[i] : 1
				const bSample = bChannel ? bChannel[i] : 1
				const multiplier = isAutomatedParam ? parameters.multiplier[i] : parameters.multiplier[0]
				channel[i] = aSample * bSample * multiplier
			}
		})
		return true
	}
}
	
registerProcessor('multiplier', Multiplier)