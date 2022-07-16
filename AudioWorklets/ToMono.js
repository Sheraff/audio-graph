class ToMono extends AudioWorkletProcessor {
	process ([input], [output], parameters) {
		if (!input?.length)
			return true
		const monoValues = input[0].map(
			(_, i) => input.reduce(
				(sum, channel) => sum + channel[i],
				0
			) / input.length
		)
		output.forEach((channel) => {
			for (let i = 0; i < channel.length; i++) {
				channel[i] = monoValues[i]
			}
		})
		return true
	}
}
	
registerProcessor('to-mono', ToMono)