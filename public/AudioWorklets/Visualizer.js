class Visualizer extends AudioWorkletProcessor {
	constructor({parameterData, ...rest}) {
		super(rest)
		this.active = true
		this.port.onmessage = ({data}) => {
			if (data.type === 'stop') {
				this.active = false
			}
		}
	}

	process ([input]) {
		if (!input?.length) {
			const array = new Float32Array(128).fill(0)
			this.port.postMessage({buffer: array.buffer}, [array.buffer])
			return this.active
		}
		this.port.postMessage({buffer: input[0].buffer}, [input[0].buffer])
		return this.active
	}
}
	
registerProcessor('visualizer', Visualizer)