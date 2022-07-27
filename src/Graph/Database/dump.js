async function* iterateIndexedDBRequestCursor (store) {
	const opener = store.openCursor()
	let resolve
	let promise = new Promise(res => resolve = res)
	opener.onsuccess = (event) => {
		const cursor = event.target.result
		if (cursor) {
			resolve(cursor.value)
			promise = new Promise(res => resolve = res)
			cursor.continue()
		} else {
			resolve()
		}
	}
	while (true) {
		const value = await promise
		if (!value) break
		yield value
	}
}

export default async function dumpIndexedDB() {
	const dump = {}
	const databases = await indexedDB.databases()
	for (const {name, version} of databases) {
		if(!name) continue
		dump[name] = {}
		const openRequest = await indexedDB.open(name, version)
		await new Promise(resolve => openRequest.onsuccess = resolve)
		const db = openRequest.result
		for (const storeName of db.objectStoreNames) {
			dump[name][storeName] = []
			const tx = db.transaction(storeName, 'readonly')
			const store = tx.objectStore(storeName)
			for await (const entry of iterateIndexedDBRequestCursor(store)) {
				dump[name][storeName].push(entry)
			}
		}
	}
	return dump
}