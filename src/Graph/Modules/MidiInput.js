import GraphAudioNode from "./GraphAudioNode"

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
			if (this.data.settings.device) {
				this.midiInputMessageController = new AbortController()
				this.midiAccess.inputs.get(this.data.settings.device).addEventListener(
					'midimessage',
					this.onMidiMessage.bind(this),
					{signal: this.midiInputMessageController.signal}
				)
			}
		}
	}

	/** @param {MIDIAccess} midiAccess */
	onMidiAccess(midiAccess) {
		this.midiAccess = midiAccess
		Object.defineProperty(this, 'midiDevices', {
			get: () => Array.from(midiAccess.inputs.entries())
				.map(([key, input]) => ({
					value: key,
					label: `${input.name} (${input.manufacturer})`,
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

	/** @param {MIDIMessageEvent} event */
	onMidiMessage(event) {
		const {data} = event
		const [type, note, velocity] = data
		if(type >= 240) return

		if (type === 144 && velocity > 0) {
			const osc = new OscillatorNode(this.audioContext, {
				frequency: 440 * Math.pow(2, (note - 69) / 12),
				detune: 0,
				type: 'sine',
			})
			const gain = new GainNode(this.audioContext, {
				gain: velocity / 127,
			})

			osc.connect(gain)
			gain.connect(this.audioNode)
			osc.start()

			this.customNodes[`osc-${note}`] = osc
			this.customNodes[`gain-${note}`] = gain

			return
		}
		
		if (type === 128 || (type === 144 && velocity === 0)) {
			if(!this.customNodes[`osc-${note}`]) return

			this.customNodes[`osc-${note}`].stop()
			this.customNodes[`osc-${note}`].disconnect()
			this.customNodes[`gain-${note}`].disconnect()
			delete this.customNodes[`osc-${note}`]
			delete this.customNodes[`gain-${note}`]

		}
	}
}