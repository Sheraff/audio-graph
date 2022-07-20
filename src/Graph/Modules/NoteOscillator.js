import GraphAudioNode from "./GraphAudioNode"

/** 
 * @param {number} note 
 * @param {number} octave 
 */
function noteToFrequency(note, octave) {
	const midi = Number(note) + (Number(octave) * 12)
	const frequency = 440 * Math.pow(2, (midi - 69) / 12)
	return frequency
}

export default class NoteOscillator extends GraphAudioNode {
	static type = 'note'
	static image = `${process.env.PUBLIC_URL}/icons/note.svg`

	static structure = {
		slots: [
			{type: 'setting', name: 'detune'},
			{type: 'output', name: 0},
		],
		settings: [
			{
				name: 'note',
				type: 'range',
				props: {
					min: 0,
					max: 11,
					step: 1,
				},
				defaultValue: 0,
				readFrom: 'value',
			},
			{
				name: 'octave',
				type: 'range',
				props: {
					min: 0,
					max: 10,
					step: 1,
				},
				defaultValue: 5,
				readFrom: 'value',
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
				props: {
				},
				options: [
					"sine",
					"square",
					"sawtooth",
					"triangle",
				],
				defaultValue: "sine",
				readFrom: 'value',
			}
		]
	}

	static requiredModules = []

	initializeAudioNodes(audioContext) {
		this.audioNode = new OscillatorNode(audioContext)
		this.audioNode.start()
	}

	updateSetting(name) {
		if(name === 'type') {
			this.audioNode.type = this.data.settings.type
		} else if(name === 'note' || name === 'octave') {
			this.audioNode.frequency.value = noteToFrequency(this.data.settings.note, this.data.settings.octave)
		} else if(name === 'detune') {
			this.audioNode.detune.value = parseFloat(this.data.settings.detune)
		}
	}
}