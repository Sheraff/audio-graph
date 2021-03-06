import GraphAudioNode from "./GraphAudioNode"

/**
 * 
 * @param {AudioContext} ctx 
 * @param {*} settings 
 * @param {AudioWorkletNode} destination 
 * @returns 
 */
function plugAutomationNode(ctx, settings, destination) {
	const offsetNode = destination.offset
	const duration = 60 / Number(settings.tempo) * 4
	const progress = ctx.currentTime % duration
	const startTime = ctx.currentTime - progress
	// const percent = progress / duration
	if (offsetNode.cancelAndHoldAtTime) {
		offsetNode.cancelAndHoldAtTime(ctx.currentTime)
	} else {
		offsetNode.cancelScheduledValues(ctx.currentTime)
	}
	if(!settings.track?.length) return
	const points = [...settings.track]
	if(points[0].x !== 0)
		points.unshift({x: 0, y: 0})
	if(points.at(-1).x !== 1)
		points.push({x: 0.9999, y: points.at(-1).y})
	// {
	// 	let nextPoint = points.findIndex(point => point.x > percent)
	// 	if (nextPoint === -1) nextPoint = 0
	// 	const prevPoint = nextPoint - 1
	// 	const progressBetweenPrevAndNext = (percent - points.at(prevPoint).x) / (points.at(nextPoint).x - points.at(prevPoint).x)
	// 	const lerpYValue = points.at(prevPoint).y + (points.at(nextPoint).y - points.at(prevPoint).y) * progressBetweenPrevAndNext
	// 	if (startTime > ctx.currentTime) {
	// 		offsetNode.setValueAtTime(lerpYValue, startTime)
	// 	}
	// }
	const interpolation = settings.interpolation === 'linear' ? 'linearRampToValueAtTime' : 'exponentialRampToValueAtTime'
	for(let i = 0; i < 15; i++) {
		points.forEach((point, p) => {
			const time = startTime + (i * duration) + (point.x * duration)
			if (time > ctx.currentTime) {
				if(p === 0)
					offsetNode.setValueAtTime(point.y, time)
				else
					offsetNode[interpolation](point.y, time)
			}
		})
	}
	return duration
}

export default class Automation extends GraphAudioNode {
	static type = 'automation'
	static image = `${process.env.PUBLIC_URL}/icons/automation.svg`
	static isSink = false
	static requiresSinkToPlay = false
	static structure = {
		slots: [
			{type: 'output', name: 0},
		],
		settings: [
			{name: 'track', type: 'track', props: {}, defaultValue: [], readFrom: 'points'},
			{name: 'tempo', type: 'range', props: {min: 1, max: 300, step: 1}, defaultValue: 120, readFrom: 'value'},
			{name: 'interpolation', type: 'select', props: {}, defaultValue: "linear", readFrom: 'value',
				options: [
					"linear",
					"exponential",
				],
			},
		],
	}

	static requiredModules = []

	initializeAudioNodes(audioContext) {
		this.audioNode = new ConstantSourceNode(audioContext, {offset: 1})
		this.audioNode.start()

		this.addEventListener('connection-status-change', () => {
			if (this.audioNode) {
				if (this.hasAudioDestination) {
					this.updateAudioNodeSettings()
				} else {
					this.audioNode.offset.cancelAndHoldAtTime(this.audioContext.currentTime)
				}
			}
		}, {signal: this.controller.signal})
	}

	scheduleTimeoutId
	updateAudioNodeSettings() {
		if (this.audioContext && this.hasAudioDestination) {
			const duration = plugAutomationNode(this.audioContext, this.data.settings, this.audioNode)
			if (this.scheduleTimeoutId) {
				clearTimeout(this.scheduleTimeoutId)
			}
			if (duration) {
				this.scheduleTimeoutId = setTimeout(() => {
					this.updateAudioNodeSettings()
				}, duration * 14_000)
			}
		}
	}

	updateSetting(name) {
		this.updateAudioNodeSettings()
	}

	cleanup() {
		clearTimeout(this.scheduleTimeoutId)
		super.cleanup()
	}
}