const dbPromises = {}

/**
 * @returns {Promise<IDBDatabase>}
 */
export default function openDB(name, version) {
	if (dbPromises[name]) return dbPromises[name]
	dbPromises[name] = new Promise(async (resolve, reject) => {
		const openRequest = await indexedDB.open(name, version)
		openRequest.onupgradeneeded = (event) => onUpgradeNeeded(name, event, reject)
		openRequest.onsuccess = () => {
			resolve(openRequest.result)
		}
		openRequest.onerror = () => {
			console.error(`failed to open db`, openRequest.error?.message)
			reject(openRequest.error)
			dbPromises[name] = null
		}
	})
	return dbPromises[name]
}

function onUpgradeNeeded(name, event, reject) {
	const db = event.target.result
	db.onerror = () => {
		console.error(`failed to upgrade db`, db.error?.message)
		reject(db.error)
		dbPromises[name] = null
	}
	switch(name) {
		case "graph-audio-node": {
			db.createObjectStore("buffers", {keyPath: "id"})
			break
		}
		default: {
			throw new Error(`Trying to open unknown database ${name}`)
		}
	}
}