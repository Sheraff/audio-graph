class Recorder extends AudioWorkletProcessor {
	constructor (...args) {
		super(...args)

		this.data = [[], []]
		this.recording = false

		this.port.onmessage = ({data: {type}}) => {
			if (type === 'start') {
				this.start()
			} else if (type === 'stop') {
				this.stop()
			}
		}
	}

	start () {
		this.data = [
			[],
			[],
		]
		this.recording = true
	}

	stop () {
		if (!this.recording) {
			return
		}
		this.recording = false
		const left = new Float32Array(this.data[0])
		const right = new Float32Array(this.data[1])
		this.port.postMessage({
			type: 'data',
			left: left.buffer,
			right: right.buffer,
		}, [left.buffer, right.buffer])
	}

	process ([input]) {
		if (!this.recording || !input?.[0]?.length) {
			return true
		}

		this.data[0].push(...input[0])
		if (input[1]) {
			this.data[1].push(...input[1])
		} else {
			this.data[1].push(...input[0])
		}

		return true
	}
}
	
registerProcessor('recorder', Recorder)