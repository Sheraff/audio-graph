import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react"

function plugAutomationNode(ctx, node, destination) {
	const offsetNode = destination.parameters.get('offset')
	const duration = Number(node.settings.duration)
	const progress = ctx.current.currentTime % duration
	const startTime = ctx.current.currentTime - progress
	const percent = progress / duration
	offsetNode.cancelScheduledValues(ctx.current.currentTime)
	const points = node.settings.track
	if(!points?.length) return
	if(points[0].x !== 0)
		points.unshift({x: 0, y: 0})
	if(points.at(-1).x !== 1)
		points.push({x: 0.9999, y: points.at(-1).y})
	{
		let nextPoint = points.findIndex(point => point.x > percent)
		if (nextPoint === -1) nextPoint = 0
		const prevPoint = nextPoint - 1
		const progressBetweenPrevAndNext = (percent - points.at(prevPoint).x) / (points.at(nextPoint).x - points.at(prevPoint).x)
		const lerpYValue = points.at(prevPoint).y + (points.at(nextPoint).y - points.at(prevPoint).y) * progressBetweenPrevAndNext
		offsetNode.setValueAtTime(lerpYValue, startTime)
	}
	const interpolation = node.settings.interpolation === 'linear' ? 'linearRampToValueAtTime' : 'exponentialRampToValueAtTime'
	for(let i = 0; i < 10_000; i++) {
		points.forEach((point, p) => {
			const time = startTime + (i * duration) + (point.x * duration)
			if (time > ctx.current.currentTime) {
				if(p === 0)
					offsetNode.setValueAtTime(point.y, time)
				else
					offsetNode[interpolation](point.y, time)
			}
		})
	}
}

function Player({nodes, connections}, ref) {
	const ctx = useRef(/** @type {AudioContext} */(null))
	if(!ctx.current) {
		ctx.current = new AudioContext()
	}
	const audioNodes = useRef({})

	useEffect(() => {
		const dispatch = () => window.dispatchEvent(new CustomEvent('audio-context', {detail: {ctx: ctx.current}}))
		const controller = new AbortController()
		window.addEventListener('audio-context-request', () => dispatch, {signal: controller.signal})
		dispatch()
		return () => {
			controller.abort()
		}
	}, [])

	const previousConnections = useRef(new Set())
	const updateConnections = useCallback(() => {
		function getNodeParams(id, defaultName) {
			const [nodeId, slotType, slotIndex] = id.split('.')
			const node = nodes.current.find(node => node.id === nodeId)
			const slot = node.slots[id]
			const audioNode = audioNodes.current[nodeId]
			if (slot.name in node.settings) {
				if(slot.name in audioNode)
					return {node: audioNode[slot.name], channel: 0}
				if(audioNode.parameters?.has(slot.name))
					return {node: audioNode.parameters.get(slot.name), channel: 0}
			}
			const channel = slot.name === defaultName ? 0 : Number(slotIndex)
			return {node: audioNode, channel}
		}

		const connectionsMemo = new Set()
		connections.current.list.forEach(connection => {
			const {from, to} = connection
			if (!from || !to) return
			const connectionId = `${from}-${to}`
			connectionsMemo.add(connectionId)
			if (previousConnections.current.has(connectionId)) return
			const fromParams = getNodeParams(from, 'out')
			const toParams = getNodeParams(to, 'in')
			if (!fromParams.node || !toParams.node) return
			if (fromParams.channel === 0 && toParams.channel === 0) {
				fromParams.node.connect(toParams.node)
			} else if (toParams.channel === 0) {
				fromParams.node.connect(toParams.node, fromParams.channel)
			} else {
				fromParams.node.connect(toParams.node, fromParams.channel, toParams.channel)
			}
		})
		previousConnections.current.forEach(connectionId => {
			if(!connectionsMemo.has(connectionId)) {
				const [from] = connectionId.split('-')
				const {node} = getNodeParams(from, 'out')
				if (node) {
					node.disconnect()
				}
			}
		})
		previousConnections.current = connectionsMemo
	}, [nodes, connections])

	const updateSettings = useCallback(() => {
		nodes.current.forEach(node => {
			const audioNode = audioNodes.current[node?.id]
			if(!audioNode) {
				console.log('node not found', node, audioNodes.current)
				return
			}
			if (node.type === 'oscillator') {
				audioNode.type = node.settings.type
				audioNode.frequency.value = node.settings.frequency
				audioNode.detune.value = parseFloat(node.settings.detune)
			} else if (node.type === 'lfo') {
				audioNode.type = node.settings.type
				audioNode.frequency.value = node.settings.frequency
			} else if (node.type === 'gain') {
				audioNode.gain.value = node.settings.gain
			} else if (node.type === 'pan') {
				audioNode.pan.value = node.settings.pan
			} else if (node.type === 'delay') {
				audioNode.delayTime.value = node.settings.delayTime
			} else if (node.type === 'constant') {
				audioNode.parameters.get('offset').value = parseFloat(node.settings.offset)
			} else if (node.type === 'biquadFilter') {
				audioNode.frequency.value = node.settings.frequency
				audioNode.Q.value = node.settings.Q
				audioNode.gain.value = node.settings.gain
			} else if (node.type === 'compressor') {
				audioNode.threshold.value = node.settings.threshold
				audioNode.knee.value = node.settings.knee
				audioNode.ratio.value = node.settings.ratio
				audioNode.attack.value = node.settings.attack
				audioNode.release.value = node.settings.release
			} else if (node.type === 'multiplier') {
				audioNode.parameters.get('multiplier').value = parseFloat(node.settings.multiplier)
			} else if (node.type === 'white-noise') {
				audioNode.parameters.get('min').value = parseFloat(node.settings.min)
				audioNode.parameters.get('max').value = parseFloat(node.settings.max)
			} else if (node.type === 'automation') {
				plugAutomationNode(ctx, node, audioNode)
			}
		})
	}, [nodes])

	const updateNodes = useCallback(() => {
		nodes.current.forEach(node => {
			if(!node || (node.id in audioNodes.current))
				return
			if (node.type === 'oscillator') {
				const oscNode = ctx.current.createOscillator()
				oscNode.start()
				audioNodes.current[node.id] = oscNode
			} else if (node.type === 'lfo') {
				const oscNode = ctx.current.createOscillator()
				oscNode.start()
				audioNodes.current[node.id] = oscNode
			} else if (node.type === 'gain') {
				const gainNode = ctx.current.createGain()
				audioNodes.current[node.id] = gainNode
			} else if (node.type === 'pan') {
				const panNode = ctx.current.createStereoPanner()
				audioNodes.current[node.id] = panNode
			} else if (node.type === 'delay') {
				const delayNode = ctx.current.createDelay()
				audioNodes.current[node.id] = delayNode
			} else if (node.type === 'biquadFilter') {
				const bqfNode = ctx.current.createBiquadFilter()
				audioNodes.current[node.id] = bqfNode
			} else if (node.type === 'merge') {
				const mergeNode = ctx.current.createChannelMerger(2)
				audioNodes.current[node.id] = mergeNode
			} else if (node.type === 'split') {
				const splitNode = ctx.current.createChannelSplitter(2)
				audioNodes.current[node.id] = splitNode
			} else if (node.type === 'constant') {
				const customNode = new AudioWorkletNode(ctx.current, 'constant-custom', {numberOfInputs: 0})
				audioNodes.current[node.id] = customNode
			} else if (node.type === 'compressor') {
				const compressorNode = ctx.current.createDynamicsCompressor()
				audioNodes.current[node.id] = compressorNode
			} else if (node.type === 'white-noise') {
				const customNode = new AudioWorkletNode(ctx.current, 'white-noise-processor', {numberOfInputs: 0})
				audioNodes.current[node.id] = customNode
			} else if (node.type === 'add-inputs') {
				const customNode = new AudioWorkletNode(ctx.current, 'add-inputs', {numberOfInputs: 2})
				audioNodes.current[node.id] = customNode
			} else if (node.type === 'multiplier') {
				const customNode = new AudioWorkletNode(ctx.current, 'multiplier', {numberOfInputs: 2})
				audioNodes.current[node.id] = customNode
			} else if (node.type === 'to-mono') {
				const customNode = new AudioWorkletNode(ctx.current, 'to-mono')
				audioNodes.current[node.id] = customNode
			} else if (node.type === 'duplicate') {
				const customNode = new AudioWorkletNode(ctx.current, 'duplicate', {numberOfOutputs: 6})
				audioNodes.current[node.id] = customNode
			} else if (node.type === 'automation') {
				const customNode = new AudioWorkletNode(ctx.current, 'constant-custom', {numberOfInputs: 0, parameterData: {offset: 1}})
				audioNodes.current[node.id] = customNode
			} else if (node.type === 'visualizer') {
				const customNode = new AudioWorkletNode(ctx.current, 'visualizer', {numberOfOutputs: 0, parameterData: {id: `${node.id}.extra.visualizer`}})
				audioNodes.current[node.id] = customNode
				customNode.port.onmessage = e => {
					window.dispatchEvent(new CustomEvent(node.id, {detail: {buffer: e.data.buffer}}))
				}
			} else if (node.type === 'output') {
				audioNodes.current[node.id] = ctx.current.destination
			}
		})
		Object.keys(audioNodes.current).forEach(id => {
			const found = nodes.current.find(node => node?.id === id)
			if (!found) {
				audioNodes.current[id].disconnect()
				delete audioNodes.current[id]
			}
		})
		updateSettings()
		updateConnections()
	}, [nodes, updateSettings, updateConnections])

	const loadModules = useCallback(async () => {
		await Promise.all([
			ctx.current.audioWorklet.addModule(process.env.PUBLIC_URL + '/AudioWorklets/WhiteNoiseSource.js'),
			ctx.current.audioWorklet.addModule(process.env.PUBLIC_URL + '/AudioWorklets/InputAdd.js'),
			ctx.current.audioWorklet.addModule(process.env.PUBLIC_URL + '/AudioWorklets/Multiply.js'),
			ctx.current.audioWorklet.addModule(process.env.PUBLIC_URL + '/AudioWorklets/ToMono.js'),
			ctx.current.audioWorklet.addModule(process.env.PUBLIC_URL + '/AudioWorklets/Duplicate.js'),
			ctx.current.audioWorklet.addModule(process.env.PUBLIC_URL + '/AudioWorklets/ConstantCustom.js'),
			ctx.current.audioWorklet.addModule(process.env.PUBLIC_URL + '/AudioWorklets/Visualizer.js'),
		])
	}, [])

	useEffect(() => {
		loadModules().then(() => {
			updateNodes()
			// updateSettings()
			updateConnections()
		})
	}, [
		loadModules,
		updateNodes,
		// updateSettings,
		updateConnections,
	])

	useImperativeHandle(ref, () => ({
		updateNodes,
		updateSettings,
		updateConnections,
		loadModules,
	}))

	return null
}

export default forwardRef(Player)