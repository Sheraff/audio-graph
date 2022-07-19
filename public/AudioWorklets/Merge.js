class Merge extends AudioWorkletProcessor {
	process (inputs, [output], parameters) {
		if (!inputs?.length || !output?.length)
			return true
		
		output.forEach((channel, channelIndex) => {
			for (let i = 0; i < channel.length; i++) {
				let count = 0
				let absSum = 0
				let sum = 0
				for (let j = 0; j < inputs.length; j++) {
					if (channelIndex in inputs[j]) {
						absSum += Math.abs(inputs[j][channelIndex][i])
						sum += inputs[j][channelIndex][i]
						count++
					}
				}
				channel[i] = Math.sign(sum) * (absSum / count)
			}
		})
		return true
	}
}
	
registerProcessor('merge', Merge)