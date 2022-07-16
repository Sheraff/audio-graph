class InputAdd extends AudioWorkletProcessor {
	process ([a, b], [output], parameters) {
		output.forEach((channel, chIndex) => {
			const aChannel = a[chIndex]
			const bChannel = b[chIndex]
			const channelCount = !!aChannel + !!bChannel
			for (let i = 0; i < channel.length; i++) {
				if (channelCount === 0) {
					channel[i] = 0
					continue
				}
				channel[i] = 0
				if (aChannel[i] !== undefined) {
					channel[i] += aChannel[i]
				}
				if (bChannel[i] !== undefined) {
					channel[i] += bChannel[i]
				}
				channel[i] /= channelCount
			}
		})
		return true
	}
}
	
registerProcessor('add-inputs', InputAdd)