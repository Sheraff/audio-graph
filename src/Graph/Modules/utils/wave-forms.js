export const defaultWaveforms = [
	'sine',
	'square',
	'sawtooth',
	'triangle',
]

export const waveforms = [
	'01_Saw',
	'02_Triangle',
	'03_Square',
	'04_Noise',
	'05_Pulse',
	'06_Warm_Saw',
	'07_Warm_Triangle',
	'08_Warm_Square',
	'09_Dropped_Saw',
	'10_Dropped_Square',
	'11_TB303_Square',
	'Bass',
	'Bass_Amp360',
	'Bass_Fuzz',
	'Bass_Fuzz_ 2',
	'Bass_Sub_Dub',
	'Bass_Sub_Dub_2',
	'Brass',
	'Brit_Blues',
	'Brit_Blues_Driven',
	'Buzzy_1',
	'Buzzy_2',
	'Celeste',
	'Chorus_Strings',
	'Dissonant Piano',
	'Dissonant_1',
	'Dissonant_2',
	'Dyna_EP_Bright',
	'Dyna_EP_Med',
	'Ethnic_33',
	'Full_1',
	'Full_2',
	'Guitar_Fuzz',
	'Harsh',
	'Mkl_Hard',
	'Organ_2',
	'Organ_3',
	'Phoneme_ah',
	'Phoneme_bah',
	'Phoneme_ee',
	'Phoneme_o',
	'Phoneme_ooh',
	'Phoneme_pop_ahhhs',
	'Piano',
	'Putney_Wavering',
	'Throaty',
	'Trombone',
	'Twelve String Guitar 1',
	'Twelve_OpTines',
	'Wurlitzer',
	'Wurlitzer_2',
]

/**
 * @param {AudioContext} audioContext
 * @param {string} type
 */
export async function periodicWaveFromType(audioContext, type) {
	const url = `${process.env.PUBLIC_URL}/wave-tables/${type}`
	const response = await fetch(url)
	const waveTable = await response.json()
	const waveform = new PeriodicWave(audioContext, {
		real: new Float32Array(waveTable.real),
		imag: new Float32Array(waveTable.imag)
	})
	return waveform
}