import { restoreIndexedDB } from "../Database/dump"

export default async function request(path) {
	const response = await fetch(path)
	const data = await response.json()
	console.log(`restoring from ${path}`)
	const {
		indexedDB: dbDump,
		localStorage: lsDump,
	} = data
	await restoreIndexedDB(dbDump)
	Object.entries(lsDump).forEach(([key, value]) => {
		localStorage.setItem(key, value)
	})
}