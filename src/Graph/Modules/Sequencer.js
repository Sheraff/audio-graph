import GraphAudioNode from "./GraphAudioNode"

export default class Sequencer extends GraphAudioNode {
	static type = 'sequencer'
	static image = `${process.env.PUBLIC_URL}/icons/sequencer.svg`
	static isSink = false
	static requiresSinkToPlay = false
	static structure = {
		slots: [
			{type: 'output', name: 0},
			{type: 'custom', name: 'a'},
			{type: 'custom', name: 'b'},
			{type: 'custom', name: 'c'},
			{type: 'custom', name: 'd'},
		],
		settings: [
			{
				name: 'tempo',
				type: 'range',
				props: {
					min: 10,
					max: 300,
					step: 1,
				},
				defaultValue: 60,
				readFrom: 'value',
			},
			{
				name: 'sequence',
				type: 'timegrid',
				props: {
					size: [4, 4],
				},
				defaultValue: [
					[1, 0, 0, 0],
					[0, 1, 0, 0],
					[0, 0, 1, 0],
					[0, 0, 0, 1],
				],
				readFrom: 'sequence',
			},
		]
	}

	static requiredModules = []

	/** @param {AudioContext} audioContext */
	initializeAudioNodes(audioContext) {
		this.customNodes.a = new GainNode(audioContext)
		this.customNodes.b = new GainNode(audioContext)
		this.customNodes.c = new GainNode(audioContext)
		this.customNodes.d = new GainNode(audioContext)

		const merger = new ChannelMergerNode(audioContext, {numberOfInputs: 5})
		this.customNodes.a.connect(merger, 0, 0)
		this.customNodes.a.connect(merger, 0, 1)
		this.customNodes.b.connect(merger, 0, 0)
		this.customNodes.b.connect(merger, 0, 1)
		this.customNodes.c.connect(merger, 0, 0)
		this.customNodes.c.connect(merger, 0, 1)
		this.customNodes.d.connect(merger, 0, 0)
		this.customNodes.d.connect(merger, 0, 1)

		this.customNodes.timer = new GainNode(audioContext, {gain: 0})
		this.customNodes.timer.connect(merger, 0, 0)

		this.audioNode = merger
		
		this.schedule()
	}
	
	updateSetting(name) {
		this.schedule()
	}

	scheduleTimeoutId
	schedule() {
		if (this.scheduleTimeoutId) {
			clearTimeout(this.scheduleTimeoutId)
		}
		const {currentTime} = this.audioContext
		const order = ['a', 'b', 'c', 'd']
		order.forEach((key) => {
			this.customNodes[key].gain.cancelAndHoldAtTime(currentTime)
		})
		const beatCount = this.data.settings.sequence[0].length
		const beatLength = 60 / this.data.settings.tempo
		const barLength = beatLength * beatCount
		const rootOffset = currentTime % barLength
		const rootTime = currentTime - rootOffset

		this.data.settings.sequence.forEach((sequence, i) => {
			const node = this.customNodes[order[i]]
			for (let repeats = -1; repeats < 15; repeats++) {
				const bars = repeats * barLength
				sequence.forEach((value, multiplier) => {
					const offset = multiplier * beatLength
					const time = rootTime + offset + bars
					if (time > currentTime) {
						const valueBefore = sequence.at(multiplier - 1)
						if (valueBefore !== value) {
							node.gain.setValueAtTime(valueBefore, time - 0.0075)
							node.gain.setTargetAtTime(value, time, 0.015)
						} else {
							node.gain.setValueAtTime(value, time)
						}
					}
				})
			}
		})

		// const node = this.customNodes.timer.parameters.get('offset')
		const node = this.customNodes.timer.gain
		node.cancelAndHoldAtTime(currentTime)
		const sequence = this.data.settings.sequence[0]
		for (let repeats = -1; repeats < 15; repeats++) {
			const bars = repeats * barLength
			sequence.forEach((_, multiplier) => {
				const offset = multiplier * beatLength
				const time = rootTime + offset + bars
				if(time > currentTime)
					node.setValueAtTime(multiplier, time)
			})
		}

		this.scheduleTimeoutId = setTimeout(() => {
			this.schedule()
		}, barLength * 14_000)
	}

	cleanup() {
		super.cleanup()
		if (this.scheduleTimeoutId) {
			clearTimeout(this.scheduleTimeoutId)
		}
	}
}