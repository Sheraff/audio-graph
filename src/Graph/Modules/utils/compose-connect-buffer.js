export default function composeConnectBuffer(node) {
	let bufferEndedController

	node.connectBuffer = function connectBuffer(){
		if (node.customNodes.source) {
			node.customNodes.source.disconnect(node.audioNode)
			node.customNodes.source = null
		}
		if (!node.buffer || !node.hasAudioDestination) {
			return
		}
		node.customNodes.source = new AudioBufferSourceNode(node.audioContext)
		node.customNodes.source.buffer = node.buffer
		node.customNodes.source.connect(node.audioNode)

		const {loopStart, loopEnd, startTime, loop, stopTime} = node.computePlaybackParameters()

		node.customNodes.source.start(startTime, loopStart)
		node.customNodes.source.loop = loop
		if (loop) {
			node.customNodes.source.loopStart = loopStart
			node.customNodes.source.loopEnd = loopEnd
		} else {
			node.customNodes.source.stop(stopTime)
		}

		node.startTime = startTime

		node.customNodes.source.playbackRate.value = node.data.settings.playbackRate || 1
	}

	node.computePlaybackParameters = function computePlaybackParameters() {
		bufferEndedController?.abort()
		const duration = node.buffer.duration
		const bounds = node.data.settings.select
		const loopStart = bounds[0] * duration
		const loopEnd = bounds[1] * duration
		const playbackRate = Number(node.data.settings.playbackRate || 1)

		if (!node.data.settings.tempo?.enabled) {
			return {
				loopStart,
				loopEnd,
				startTime: node.audioContext.currentTime,
				loop: true
			}
		}

		const beatLength = 60 / node.data.settings.tempo.value
		const boundedDuration = (loopEnd - loopStart) / playbackRate
		const timeInCurrentBeat = node.audioContext.currentTime % beatLength
		const nextStartOnBeat = timeInCurrentBeat === 0
			? node.audioContext.currentTime
			: node.audioContext.currentTime - timeInCurrentBeat + beatLength
		
		if (boundedDuration >= beatLength) {
			const boundedLoopEnd = loopStart + beatLength * playbackRate
			return {
				loopStart,
				loopEnd: boundedLoopEnd,
				startTime: nextStartOnBeat,
				loop: true,
			}
		}

		bufferEndedController = new AbortController()
		node.customNodes.source?.addEventListener(
			'ended',
			() => node.connectBuffer(),
			{once: true, signal: bufferEndedController.signal}
		)

		return {
			loopStart,
			startTime: nextStartOnBeat,
			loop: false,
			stopTime: nextStartOnBeat + boundedDuration
		}
	}

	node.addEventListener('connection-status-change', () => {
		if (node.hasAudioDestination && node.buffer) {
			node.connectBuffer()
			return
		}
		if (!node.hasAudioDestination && node.customNodes.source) {
			node.customNodes.source.stop(node.audioContext.currentTime)
			node.startTime = null
			node.customNodes.source.disconnect(node.audioNode)
			node.customNodes.source = null
		}
	}, {signal: node.controller.signal})
}