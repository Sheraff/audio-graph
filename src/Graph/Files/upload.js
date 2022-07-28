import { clearIndexedDB, restoreIndexedDB } from "../Database/dump"
import { decompress } from "./gzip"

/**
 * @param {InputEvent} e
 * @returns {Promise<void>}
 */
export function openGraph(e) {
	const input = /** @type {HTMLInputElement} */(e.target)
	const file = input.files?.[0]
	if (!file) {
		return Promise.reject('No file selected')
	}
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = async function(e) {
			const {result} = e.target || {}
			if (!(result instanceof ArrayBuffer)) {
				reject('File is wrong format')
				return
			}
			await clearIndexedDB()
			localStorage.clear()
			const string = await decompress(result, 'gzip')
			const {
				indexedDB: dbDump,
				localStorage: lsDump,
			} = JSON.parse(string)
			await restoreIndexedDB(dbDump)
			Object.entries(lsDump).forEach(([key, value]) => {
				localStorage.setItem(key, value)
			})
			resolve()
			window.location.reload()
		}
		reader.readAsArrayBuffer(file)
	})
}