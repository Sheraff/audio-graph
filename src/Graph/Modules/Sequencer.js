import GraphAudioNode from "./GraphAudioNode"

export default class Sequencer extends GraphAudioNode {
	static type = 'sequencer'
	static image = `${process.env.PUBLIC_URL}/icons/sequencer.svg`

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

	static requiredModules = [
		`${process.env.PUBLIC_URL}/AudioWorklets/ConstantCustom.js`
	]

	/** @param {AudioContext} audioContext */
	initializeAudioNodes(audioContext) {
		this.customNodes.a = new GainNode(audioContext)
		this.customNodes.b = new GainNode(audioContext)
		this.customNodes.c = new GainNode(audioContext)
		this.customNodes.d = new GainNode(audioContext)

		const merger = new ChannelMergerNode(audioContext, {numberOfInputs: 4})
		this.customNodes.a.connect(merger, 0, 0)
		this.customNodes.a.connect(merger, 0, 1)
		this.customNodes.b.connect(merger, 0, 0)
		this.customNodes.b.connect(merger, 0, 1)
		this.customNodes.c.connect(merger, 0, 0)
		this.customNodes.c.connect(merger, 0, 1)
		this.customNodes.d.connect(merger, 0, 0)
		this.customNodes.d.connect(merger, 0, 1)

		this.audioNode = new GainNode(audioContext)
		merger.connect(this.audioNode)

		this.customNodes.timer = new AudioWorkletNode(audioContext, 'constant-custom', {numberOfInputs: 0, parameterData: {offset: 0}})
		this.customNodes.timeAnalyser = new AnalyserNode(audioContext)
		this.customNodes.timer.connect(this.customNodes.timeAnalyser)
		
		this.schedule()
	}
	
	updateSetting(name) {
		this.schedule()
	}

	lastBeatStartTime
	previousTempo
	schedule() {
		const {currentTime} = this.audioContext
		const order = ['a', 'b', 'c', 'd']
		order.forEach((key) => {
			this.customNodes[key].gain.cancelScheduledValues(currentTime)
		})
		const beatCount = this.data.settings.sequence[0].length
		const beatLength = 60 / this.data.settings.tempo
		const barLength = beatLength * beatCount

		////////////////////////////////////////
		// TODO: FIX THIS AWFUL MESS OF MATHS //
		////////////////////////////////////////

		let beatCountOffset = 0
		let timeOffset = 0
		if(this.lastBeatStartTime) {
			const previousBeatLength = this.previousTempo
				? 60 / this.previousTempo
				: beatLength
			const previousBarLength = this.previousTempo
				? previousBeatLength * beatCount
				: barLength
			const remainderInBar = (currentTime - this.lastBeatStartTime) % previousBarLength
			const remainderInBeat = remainderInBar % previousBeatLength
			beatCountOffset = Math.round((remainderInBar - remainderInBeat) / previousBeatLength)
			// const percentAlongCurrentBeat = remainderInBeat / previousBeatLength
			timeOffset = remainderInBeat
		}

		this.data.settings.sequence.forEach((sequence, i) => {
			const node = this.customNodes[order[i]]
			for (let repeats = 0; repeats < 1000; repeats++) {
				const bars = repeats * barLength
				sequence.forEach((value, multiplier) => {
					const offset = ((multiplier + beatCountOffset) % beatCount) * beatLength
					node.gain.setValueAtTime(value, currentTime + offset + bars + timeOffset)
				})
			}
		})

		const node = this.customNodes.timer.parameters.get('offset')
		node.cancelScheduledValues(currentTime + timeOffset)
		const sequence = this.data.settings.sequence[0]
		for (let repeats = 0; repeats < 1000; repeats++) {
			const bars = repeats * barLength
			sequence.forEach((_, multiplier) => {
				const offset = ((multiplier + beatCountOffset) % beatCount) * beatLength
				const value = multiplier / beatCount
				node.setValueAtTime(value, currentTime + offset + bars + timeOffset)
			})
		}

		this.lastBeatStartTime = currentTime
		this.previousTempo = this.data.settings.tempo
	}
}