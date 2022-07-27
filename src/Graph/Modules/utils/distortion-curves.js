// https://github.com/micbuffa/WebAudio-Guitar-Amplifier-Simulator-3/blob/master/js/distorsionFactory.js

function tanh(n) {
	return (Math.exp(n) - Math.exp(-n)) / (Math.exp(n) + Math.exp(-n))
}

function sign(x) {
	if (x === 0) {
		return 1
	} else {
		return Math.abs(x) / x
	}
}

function interpolate(value, fromStart, fromStop, toStart, toStop) {
	return toStart + (toStop - toStart) * ((value - fromStart) / (fromStop - fromStart))
}

function getBezierValue(t, p0, h0, h1, p1) {
	const cX = 3 * (h0.x - p0.x)
	const bX = 3 * (h1.x - h0.x) - cX
	const aX = p1.x - p0.x - cX - bX

	const cY = 3 * (h0.y - p0.y)
	const bY = 3 * (h1.y - h0.y) - cY
	const aY = p1.y - p0.y - cY - bY

	const x = (aX * t**3) + (bX * t**2) + (cX * t) + p0.x
	const y = (aY * t**3) + (bY * t**2) + (cY * t) + p0.y

	return { x, y }
}

// all distorsion values in [0, 1500]
const distortionCurves = {
	// https://stackoverflow.com/questions/22312841/waveshaper-node-in-webaudio-how-to-emulate-distortion
	basic(_amount, sampleRate) {
		const n_samples = sampleRate
		const curve = new Float32Array(n_samples)
		const amount = _amount / 15
			
		curve.forEach((_, i) => {
			const x = i * 2 / n_samples - 1
			curve[i] = (Math.PI + amount) * x / (Math.PI + amount * Math.abs(x))
		})

		return curve
	},

	// Classic one
	standard(_amount, sampleRate) {
		const n_samples = sampleRate
		const curve = new Float32Array(n_samples)
		const amount = _amount
		const deg = Math.PI / 180

		for (let i = 0; i < n_samples; ++i) {
			const x = i * 2 / n_samples - 1
			curve[i] = (3 + amount) * x * 57 * deg / (Math.PI + amount * Math.abs(x))
		}

		return curve
	},

	standardLower(_amount, sampleRate) {
		const n_samples = sampleRate
		const curve = new Float32Array(n_samples)
		const amount = _amount
		const deg = Math.PI / 180

		for (let i = 0; i < n_samples; ++i) {
			const x = i * 2 / n_samples - 1
			curve[i] = (3 + amount) * x * 20 * deg / (Math.PI + amount * Math.abs(x))
		}

		return curve
	},

	// Tuna JS 1
	smooth(_amount, sampleRate) {
		const n_samples = sampleRate
		const curve = new Float32Array(n_samples)
		const amount = Math.min(_amount / 1500, 0.9)
		const k = 2 * amount / (1 - amount)

		for (let i = 0; i < n_samples; i++) {
			const x = i * 2 / n_samples - 1
			curve[i] = (1 + k) * x / (1 + k * Math.abs(x))
		}

		return curve
	},

	// Tuna JS 3
	fuzz(_amount, sampleRate) {
		const n_samples = sampleRate
		const curve = new Float32Array(n_samples)
		const amount = 1 - (_amount / 1500)

		for (let i = 0; i < n_samples; i++) {
			const x = i * 2 / n_samples - 1
			const y = x < 0
				? -(Math.abs(x) ** (amount + 0.04))
				: x ** amount
			curve[i] = tanh(y * 2)
		}

		return curve
	},

	// Tuna JS 4
	clean(_amount, sampleRate) {
		const n_samples = sampleRate
		const curve = new Float32Array(n_samples)
		const normalized = _amount / 1500
		const a = 1 - normalized > 0.99
			? 0.99
			: 1 - normalized

		for (let i = 0; i < n_samples; i++) {
			const x = i * 2 / n_samples - 1
			const abx = Math.abs(x)
			const y = abx > a
				? a + (abx - a) / (1 + Math.pow((abx - a) / (1 - a), 2))
				: abx
			curve[i] = sign(x) * y * (1 / ((a + 1) / 2))
		}

		return curve
	},

	// tuna JS 5
	asymmetric(_amount, sampleRate) {
		const n_samples = sampleRate
		const curve = new Float32Array(n_samples)

		for (let i = 0; i < n_samples; i++) {
			const x = i * 2 / n_samples - 1
			if (x < -0.08905) {
				curve[i] = (-3 / 4) * (1 - (Math.pow((1 - (Math.abs(x) - 0.032857)), 12)) + (1 / 3) * (Math.abs(x) - 0.032847)) + 0.01
			} else if (x >= -0.08905 && x < 0.320018) {
				curve[i] = (-6.153 * (x * x)) + 3.9375 * x
			} else {
				curve[i] = 0.630035
			}
		}

		return curve
	},


	// From GFX, tweaked for most of them...
	notSoDistorded(_amount, sampleRate) {
		const n_samples = sampleRate / 2
		const curve = new Float32Array(n_samples)
		const amount = Math.pow(_amount / 150 + 2, 3)

		for (let d = 0; n_samples > d; d += 1) {
			const f = 2 * d / n_samples - 1
			curve[d] = (1 + amount) * f / (1 + amount * Math.abs(f))
		}

		return curve
	},

	crunch(_amount, sampleRate) {
		const n_samples = sampleRate / 2
		const curve = new Float32Array(n_samples)
		const amount = (_amount / 150) ** 2

		for (let d = 0; n_samples > d; d += 1) {
			const f = 2 * d / n_samples - 1
			curve[d] = (1 + amount) * f / (1 + amount * Math.abs(f))
		}

		return curve
	},

	classA(_amount, sampleRate) {
		const n_samples = sampleRate / 2
		const curve = new Float32Array(n_samples)
		const amount = 10 + 3 * (_amount / 150)

		for (let d = 0; n_samples > d; d += 1) {
			const e = 2 * d / n_samples - 1
			curve[d] = (1 + amount) * e / (1 + amount * Math.abs(e))
		}

		return curve
	},

	superClean(_amount, sampleRate) {
		const n_samples = sampleRate / 2
		const curve = new Float32Array(n_samples)
		const amount = (_amount / 150 + 6) / 4

		for (let d = 0; n_samples > d; d += 1) {
			const e = 2 * d / n_samples - 1
			curve[d] = (1 + amount) * e / (1 + amount * Math.abs(e))
		}

		return curve
	},

	vertical(_amount, sampleRate) {
		const n_samples = sampleRate / 2
		const curve = new Float32Array(n_samples)
		const amount = (_amount / 150 + 2) ** 3

		for (let d = 0; n_samples > d; d += 1) {
			const e = 2 * d / n_samples - 1
			curve[d] = (1 + amount) * e / (1 + amount * Math.abs(e))
		}
		return curve
	},

	superFuzz(_amount, sampleRate) {
		const n_samples = sampleRate / 2
		const curve = new Float32Array(n_samples)
		const amount = (_amount / 150) ** 3

		for (let d = 0; n_samples > d; d += 1) {
			const e = 2 * d / n_samples - 1
			curve[d] = (1 + amount) * e / (1 + amount * Math.abs(e))
		}
		return curve
	},

	noisyHiGain(_amount, sampleRate) {
		const n_samples = sampleRate / 2
		const curve = new Float32Array(n_samples)
		const amount = _amount / 1530

		for (let d = 0; n_samples > d; d += 1) {
			if (2 * d / n_samples - 1 < 0) {
				curve[d] = -amount
			} else {
				curve[d] = amount
			}
		}

		return curve
	},

	hiGainModern(_amount, sampleRate) {
		const n_samples = sampleRate / 2
		const curve = new Float32Array(n_samples)
		const amount = 1 / ((_amount / 2) ** 4 + 1)

		for (let d = 0; n_samples > d; d += 1) {
			const e = 2 * d / n_samples - 1
			curve[d] = e / (Math.abs(e) + amount)
		}

		return curve
	},

	bezier(_amount, sampleRate) {
		const p0 = { x: 0, y: 100 }
		const h0 = { x: 10, y: 50 }
		const h1 = { x: 0, y: 50 }
		const p1 = { x: 100, y: 0 }

		const n_samples = sampleRate
		const accuracy = 1 / n_samples
		const curve = new Float32Array(n_samples)

		let index = 0

		curve[index++] = interpolate(p0.y, 0, 100, 1, -1)

		for (let i = 0; i < 1; i += accuracy) {
			const p = getBezierValue(i, p0, h0, h1, p1)
			curve[index++] = interpolate(p.y, 0, 100, 1, -1)
		}

		return curve
	}
}

export default distortionCurves