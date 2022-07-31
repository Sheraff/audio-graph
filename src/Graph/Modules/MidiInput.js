import GraphAudioNode from "./GraphAudioNode"
import { defaultWaveforms, periodicWaveFromType, waveforms } from "./utils/wave-forms"

export default class MidiInput extends GraphAudioNode {
	static type = 'midi-input'
	static image = `${process.env.PUBLIC_URL}/icons/midi-input.svg`
	static isSink = false
	static requiresSinkToPlay = false
	static structure = {
		slots: [
			{type: 'output', name: 0},
		],
		settings: [
			{
				type: 'dynamic-select',
				name: 'device',
				defaultValue: '',
				readFrom: 'value',
				optionsFrom: 'midiDevices'
			},
			{
				name: 'detune',
				type: 'range',
				props: {
					min: -4800,
					max: 4800,
					step: 100,
				},
				defaultValue: 0,
				readFrom: 'value',
			},
			{
				name: 'type',
				type: 'select',
				options: [...defaultWaveforms, ...waveforms],
				defaultValue: "sine",
				readFrom: 'value',
			}
		]
	}

	static requiredModules = []

	midiDevices = []

	initializeAudioNodes(audioContext) {
		this.audioNode = new GainNode(audioContext, {gain: 0.1})

		navigator
			.requestMIDIAccess()
			.then(this.onMidiAccess.bind(this))
	}

	updateSetting(name) {
		if (name === 'device' && this.midiAccess) {
			this.onMidiDeviceDisconnected()
			if (this.midiAccess.inputs.has(this.data.settings.device)) {
				this.midiInputMessageController = new AbortController()
				this.midiAccess.inputs.get(this.data.settings.device).addEventListener(
					'midimessage',
					this.onMidiMessage.bind(this),
					{signal: this.midiInputMessageController.signal}
				)
			}
		} else if (name === 'type') {
			const type = this.data.settings.type
			if (defaultWaveforms.includes(type)) {
				this.selectedWaveform = null
				Object.values(this.customNodes).forEach(node => {
					if (node && ('type' in node)) {
						node.type = type
					}
				})
			} else {
				this.onSelect(type)
			}
		} else if (name === 'detune') {
			const value = parseFloat(this.data.settings.detune)
			Object.values(this.customNodes).forEach(node => {
				if (node && ('detune' in node)) {
					node.detune.value = value
				}
			})
		}
	}

	async onSelect(type) {
		const waveform = await periodicWaveFromType(this.audioContext, type)
		if (type === this.data.settings.type) {
			this.selectedWaveform = waveform
			Object.values(this.customNodes).forEach(node => {
				if (node && ('setPeriodicWave' in node)) {
					node.setPeriodicWave(waveform)
				}
			})
		}
	}

	/** @param {MIDIAccess} midiAccess */
	onMidiAccess(midiAccess) {
		this.midiAccess = midiAccess
		Object.defineProperty(this, 'midiDevices', {
			get: () => Array.from(midiAccess.inputs.entries())
				.map(([key, input]) => ({
					value: key,
					label: input.name,
				}))
		})
		this.dispatchEvent(new CustomEvent('midiDevices'))
		this.midiAccess.addEventListener('statechange', ({port}) => {
			if (port.state === 'disconnected' && port.id === this.data.settings.device) {
				this.onMidiDeviceDisconnected()
			}
			this.dispatchEvent(new CustomEvent('midiDevices'))
		})
		if (this.data.settings.device) {
			this.updateSetting('device')
		}
	}

	onMidiDeviceDisconnected() {
		if (this.midiInputMessageController) {
			this.midiInputMessageController.abort()
			Object.keys(this.customNodes).forEach(key => {
				this.customNodes[key].disconnect()
				delete this.customNodes[key]
			})
			this.midiInputMessageController = null
		}
	}

	isSustain = 0
	sustainedNotes = new Set()

	/** @param {MIDIMessageEvent} event */
	onMidiMessage(event) {
		const [type, note, velocity] = event.data
		if(type >= 240) return

		if (type === 144 && velocity > 0) {
			// fade existing note
			if (this.sustainedNotes.has(note)) {
				const gain = this.customNodes[`gain-${note}`]
				const osc = this.customNodes[`osc-${note}`]
				gain.gain.setValueAtTime(gain.gain.value, this.audioContext.currentTime)
				gain.gain.exponentialRampToValueAtTime(0.0001, this.audioContext.currentTime + 0.1)
				setTimeout(() => {
					this.smoothConnectionSwitch({
						action: 'disconnect',
						from: { node: osc },
						to: { node: gain },
					})
				}, 100)
			}
			// play new note
			const osc = new OscillatorNode(this.audioContext, {
				frequency: 440 * Math.pow(2, (note - 69) / 12),
				detune: parseFloat(this.data.settings.detune),
			})
			if (this.selectedWaveform) {
				osc.setPeriodicWave(this.selectedWaveform)
			} else if (defaultWaveforms.includes(this.data.settings.type)) {
				osc.type = this.data.settings.type
			} else {
				osc.type = 'sine'
			}
			osc.start()

			const gain = new GainNode(this.audioContext, {gain: velocity / 127})
			gain.connect(this.audioNode)

			this.smoothConnectionSwitch({
				action: 'connect',
				from: {
					node: osc,
				},
				to: {
					node: gain,
				},
			})

			this.customNodes[`osc-${note}`] = osc
			this.customNodes[`gain-${note}`] = gain

			return
		}
		
		if (type === 128 || (type === 144 && velocity === 0)) {
			if (!this.customNodes[`osc-${note}`]) return
			if (this.isSustain) {
				this.sustainedNotes.add(note)
				const gain = this.customNodes[`gain-${note}`]
				const value = gain.gain.value
				gain.gain.setValueAtTime(value, this.audioContext.currentTime)
				gain.gain.exponentialRampToValueAtTime(value * this.isSustain / 127, this.audioContext.currentTime + 0.1)
				return
			}

			this.smoothConnectionSwitch({
				action: 'disconnect',
				from: {
					node: this.customNodes[`osc-${note}`],
				},
				to: {
					node: this.customNodes[`gain-${note}`],
				},
			})

			this.discardedNodes.add(this.customNodes[`gain-${note}`])
			this.discardedNodes.add(this.customNodes[`osc-${note}`])
			delete this.customNodes[`osc-${note}`]
			delete this.customNodes[`gain-${note}`]

			return
		}

		if (type === 176 && velocity > 0) {
			this.isSustain = velocity
			this.sustainedNotes.forEach(note => {
				const gain = this.customNodes[`gain-${note}`]
				const value = gain.gain.value
				gain.gain.setValueAtTime(value, this.audioContext.currentTime)
				gain.gain.exponentialRampToValueAtTime(value * this.isSustain / 127, this.audioContext.currentTime + 0.1)
			})
			return
		}
		if (type === 176 && velocity === 0) {
			this.isSustain = 0
			this.sustainedNotes.forEach(note => {
				this.onMidiMessage({
					data: [128, note, 0],
				})
			})
			this.sustainedNotes.clear()
			return
		}

		console.log('unhandled MIDI message', [type, note, velocity])
	}

	discardedNodes = new Set()
	ricDiscardedNodes = null
	cleanDiscardedNodes() {
		if (this.ricDiscardedNodes) return
		this.ricDiscardedNodes = requestIdleCallback(() => {
			this.ricDiscardedNodes = null
			this.discardedNodes.forEach(node => {
				node.disconnect()
			})
			this.discardedNodes.clear()
		})
	}

	cleanup() {
		super.cleanup()
		if(this.ricDiscardedNodes) {
			cancelIdleCallback(this.ricDiscardedNodes)
			this.ricDiscardedNodes = null
		}
	}
}