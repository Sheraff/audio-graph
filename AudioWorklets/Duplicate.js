class Duplicate extends AudioWorkletProcessor {
	process ([input], outputs, parameters) {
		if (!input?.length)
			return true
		outputs.forEach((output) => {
			output.forEach((channel, channelIndex) => {
				if (input[channelIndex]) {
					for (let i = 0; i < channel.length; i++) {
						channel[i] = input[channelIndex][i]
					}
				}
			})
		})
		return true
	}
}
	
registerProcessor('duplicate', Duplicate)