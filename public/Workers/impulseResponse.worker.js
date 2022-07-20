onmessage = ({data: {
	sampleRate,
	duration,
	decay,
	reverse,
}}) => {
	const {left, right} = impulseResponse(sampleRate, duration, decay, reverse)
	postMessage({left, right}, [left, right])
}


function impulseResponse(sampleRate, duration, decay = 2, reverse = false) {
	const length = sampleRate * duration
	const left = new Float32Array(length)
	const right = new Float32Array(length)

	for (let i = 0; i < length; i++){
		const n = reverse ? length - i : i;
		left[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
		right[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
	}
	return {left: left.buffer, right: right.buffer};
}