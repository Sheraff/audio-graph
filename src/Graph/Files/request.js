import { restoreIndexedDB } from "../Database/dump"
import { decompress } from "./gzip"

export default async function request(path) {
	const response = await fetch(path)
	const data = await response.arrayBuffer()
	const string = await decompress(data, 'gzip')
	const json = JSON.parse(string)
	console.log(`restoring from ${path}`)
	const {
		indexedDB: dbDump,
		localStorage: lsDump,
	} = json
	await restoreIndexedDB(dbDump)
	Object.entries(lsDump).forEach(([key, value]) => {
		localStorage.setItem(key, value)
	})
}