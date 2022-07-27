let dbPromise

/**
 * @returns {Promise<IDBDatabase>}
 */
export default function openDB() {
	if (dbPromise) return dbPromise
	dbPromise = new Promise(async (resolve, reject) => {
		const openRequest = await indexedDB.open("graph-audio-node", 1)
		openRequest.onupgradeneeded = (event) => onUpgradeNeeded(event, reject)
		openRequest.onsuccess = () => {
			resolve(openRequest.result)
		}
		openRequest.onerror = () => {
			console.error(`failed to open db`, openRequest.error?.message)
			reject(openRequest.error)
			dbPromise = null
		}
	})
	return dbPromise
}

function onUpgradeNeeded(event, reject) {
	const db = event.target.result
	db.onerror = () => {
		console.error(`failed to upgrade db`, db.error?.message)
		reject(db.error)
		dbPromise = null
	}
	db.createObjectStore("buffers", {keyPath: "id"})
}