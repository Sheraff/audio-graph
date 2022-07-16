import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react"

function Player({nodes, connections}, ref) {
	const ctx = useRef(/** @type {AudioContext} */(null))
	if(!ctx.current) {
		ctx.current = new AudioContext()
	}
	const audioNodes = useRef({})

	const updateConnections = useCallback(() => {
		Object.keys(audioNodes.current).forEach(id => {
			audioNodes.current[id].disconnect()
		})
		function getNodeParams(id, defaultName) {
			const [nodeId, slotType, slotIndex] = id.split('.')
			const node = nodes.current.find(node => node.id === nodeId)
			const slot = node.slots[id]
			const audioNode = audioNodes.current[nodeId]
			if (slot.name in node.settings) {
				return {node: audioNode[slot.name], channel: 0}
			}
			const channel = slot.name === defaultName ? 0 : Number(slotIndex)
			return {node: audioNode, channel}
		}
		connections.current.list.forEach(connection => {
			const {from, to} = connection
			if (!from || !to) return
			const fromParams = getNodeParams(from, 'out')
			const toParams = getNodeParams(to, 'in')
			if (!fromParams.node || !toParams.node) return
			if (fromParams.channel === 0 && toParams.channel === 0) {
				fromParams.node.connect(toParams.node)
			} else {
				fromParams.node.connect(toParams.node, fromParams.channel, toParams.channel)
			}
		})
	}, [nodes, connections])

	const updateSettings = useCallback(() => {
		nodes.current.forEach(node => {
			const audioNode = audioNodes.current[node.id]
			if(!audioNode) {
				console.log('node not found', node, audioNodes.current)
				return
			}
			if (node.type === 'oscillator') {
				audioNode.type = node.settings.type
				audioNode.frequency.value = node.settings.frequency
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
				audioNode.offset.value = node.settings.offset
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
			} else if (node.type === 'output') {
			}
		})
	}, [nodes])

	const updateNodes = useCallback(() => {
		nodes.current.forEach(node => {
			if(node.id in audioNodes.current)
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
				const constantNode = ctx.current.createConstantSource()
				audioNodes.current[node.id] = constantNode
			} else if (node.type === 'compressor') {
				const compressorNode = ctx.current.createDynamicsCompressor()
				audioNodes.current[node.id] = compressorNode
			} else if (node.type === 'white-noise') {
				const whiteNoiseNode = new AudioWorkletNode(ctx.current, 'white-noise-processor', {numberOfInputs: 0})
				audioNodes.current[node.id] = whiteNoiseNode
			} else if (node.type === 'add-inputs') {
				const whiteNoiseNode = new AudioWorkletNode(ctx.current, 'add-inputs', {numberOfInputs: 2})
				audioNodes.current[node.id] = whiteNoiseNode
			} else if (node.type === 'multiplier') {
				const whiteNoiseNode = new AudioWorkletNode(ctx.current, 'multiplier')
				audioNodes.current[node.id] = whiteNoiseNode
			} else if (node.type === 'output') {
				audioNodes.current[node.id] = ctx.current.destination
			}
		})
		Object.keys(audioNodes.current).forEach(id => {
			const found = nodes.current.find(node => node.id === id)
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
			ctx.current.audioWorklet.addModule('AudioWorklets/WhiteNoiseSource.js'),
			ctx.current.audioWorklet.addModule('AudioWorklets/InputAdd.js'),
			ctx.current.audioWorklet.addModule('AudioWorklets/Multiply.js'),
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