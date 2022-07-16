const TYPES = {
	output: {
		inputs: [
			{name: 'in'},
		],
	},
	gain: {
		inputs: [
			{name: 'in'},
			{name: 'gain'},
		],
		outputs: [
			{
				name: 'out',
			},
		],
		settings: [
			{
				name: 'gain',
				type: 'range',
				props: {
					min: 0,
					max: 2,
					step: 0.01,
				},
				defaultValue: 1,
				readFrom: 'value',
			}
		]
	},
	oscillator: {
		inputs: [
			{name: 'frequency'},
		],
		outputs: [
			{
				name: 'out',
			}
		],
		settings: [
			{
				name: 'frequency',
				type: 'range',
				props: {
					min: 20,
					max: 20000,
					step: 1,
				},
				defaultValue: 440,
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
	},
	lfo: {
		inputs: [
			{name: 'frequency'},
		],
		outputs: [
			{
				name: 'out',
			}
		],
		settings: [
			{
				name: 'frequency',
				type: 'range',
				props: {
					min: 0.00001,
					max: 10,
					step: 0.01,
				},
				defaultValue: 0.00003,
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
	},
	pan: {
		inputs: [
			{name: 'in'},
			{name: 'pan'},
		],
		outputs: [
			{
				name: 'out',
			},
		],
		settings: [
			{
				name: 'pan',
				type: 'range',
				props: {
					min: -1,
					max: 1,
					step: 0.01,
				},
				defaultValue: 0,
				readFrom: 'value',
			}
		]
	},
	delay: {
		inputs: [
			{name: 'in'},
			{name: 'delayTime'},
		],
		outputs: [
			{
				name: 'out',
			},
		],
		settings: [
			{
				name: 'delayTime',
				type: 'range',
				props: {
					min: 0,
					max: 179,
					step: 0.01,
				},
				defaultValue: 1,
				readFrom: 'value',
			},
		]
	},
	biquadFilter: {
		inputs: [
			{name: 'in'},
			{name: 'frequency'},
			{name: 'Q'},
			{name: 'gain'},
		],
		outputs: [
			{
				name: 'out',
			}
		],
		settings: [
			{
				name: 'frequency',
				type: 'range',
				props: {
					min: 20,
					max: 20000,
					step: 1,
				},
				defaultValue: 440,
				readFrom: 'value',
			},
			{
				name: 'type',
				type: 'select',
				props: {
				},
				options: [
					"lowpass",
					"highpass",
					"bandpass",
					"lowshelf",
					"highshelf",
					"peaking",
					"notch",
					"allpass",
				],
				defaultValue: "lowpass",
				readFrom: 'value',
			},
			{
				name: 'Q',
				type: 'range',
				props: {
					min: 0.0001,
					max: 1000,
					step: 0.0001,
				},
				defaultValue: 1,
				readFrom: 'value',
			},
			{
				name: 'gain',
				type: 'range',
				props: {
					min: 0,
					max: 2,
					step: 0.01,
				},
				defaultValue: 1,
				readFrom: 'value',
			}
		]
	},
	merge: {
		inputs: [
			{name: 'in1'},
			{name: 'in2'},
		],
		outputs: [
			{
				name: 'out',
			},
		],
	},
	split: {
		inputs: [
			{name: 'in'},
		],
		outputs: [
			{
				name: 'out1',
			},
			{
				name: 'out2',
			},
		],
	},
	constant: {
		outputs: [
			{
				name: 'out',
			},
		],
		settings: [
			{
				name: 'offset',
				type: 'range',
				props: {
					min: -1,
					max: 1,
					step: 0.001,
				},
				defaultValue: 1,
				readFrom: 'value',
			},
		]
	},
	compressor: {
		inputs: [
			{name: 'in'},
			{name: 'threshold'},
			{name: 'knee'},
			{name: 'ratio'},
			{name: 'attack'},
			{name: 'release'},
		],
		outputs: [
			{
				name: 'out',
			},
		],
		settings: [
			{name: 'threshold', type: 'range', props: {min: -100, max: 0, step: 1}, defaultValue: -10, readFrom: 'value'},
			{name: 'knee', type: 'range', props: {min: 0, max: 40, step: 1}, defaultValue: 10, readFrom: 'value'},
			{name: 'ratio', type: 'range', props: {min: 1, max: 20, step: 1}, defaultValue: 2, readFrom: 'value'},
			{name: 'attack', type: 'range', props: {min: 0, max: 1, step: 0.001}, defaultValue: 0.1, readFrom: 'value'},
			{name: 'release', type: 'range', props: {min: 0, max: 1, step: 0.001}, defaultValue: 0, readFrom: 'value'},
		]
	},
	'white-noise': {
		outputs: [
			{
				name: 'out',
			},
		],
	},
	'add-inputs': {
		inputs: [
			{name: 'in1'},
			{name: 'in2'},
		],
		outputs: [
			{
				name: 'out',
			},
		],
	},
	'multiplier': {
		inputs: [
			{name: 'in'},
		],
		outputs: [
			{name: 'out'},
		],
		settings: [
			{name: 'multiplier', type: 'range', props: {min: -1000, max: 1000, step: 0.1}, defaultValue: -1, readFrom: 'value'},
		],
	},
	'to-mono': {
		inputs: [
			{name: 'in'},
		],
		outputs: [
			{name: 'out'},
		]
	},
}

export default TYPES