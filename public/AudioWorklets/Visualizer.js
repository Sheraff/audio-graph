class Visualizer extends AudioWorkletProcessor {
	constructor({parameterData, ...rest}) {
		super(rest)
		this.port.onmessage = (e) => {
			this.buffer = e.data.array
		}
	}

	process ([input]) {
		if (!input?.length) {
			const array = new Float32Array(128).fill(0)
			this.port.postMessage({buffer: array.buffer}, [array.buffer])
			return true
		}
		this.port.postMessage({buffer: input[0].buffer}, [input[0].buffer])
		return true
	}
}
	
registerProcessor('visualizer', Visualizer)