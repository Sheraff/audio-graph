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

	schedule() {
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
			for (let repeats = -1; repeats < 100; repeats++) {
				const bars = repeats * barLength
				sequence.forEach((value, multiplier) => {
					const offset = multiplier * beatLength
					const time = rootTime + offset + bars
					if(time > currentTime)
						node.gain.setValueAtTime(value, time)
				})
			}
		})

		const node = this.customNodes.timer.parameters.get('offset')
		node.cancelAndHoldAtTime(currentTime)
		const sequence = this.data.settings.sequence[0]
		for (let repeats = -1; repeats < 100; repeats++) {
			const bars = repeats * barLength
			sequence.forEach((_, multiplier) => {
				const offset = multiplier * beatLength
				const value = multiplier / beatCount
				const time = rootTime + offset + bars
				if(time > currentTime)
					node.setValueAtTime(value, time)
			})
		}
	}
}