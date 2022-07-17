class InputAdd extends AudioWorkletProcessor {
	process ([a, b], [output], parameters) {
		if(!a?.length && !b?.length)
			return true
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
				if (!!aChannel) {
					channel[i] += aChannel[i]
				}
				if (!!bChannel) {
					channel[i] += bChannel[i]
				}
			}
		})
		return true
	}
}
	
registerProcessor('add-inputs', InputAdd)