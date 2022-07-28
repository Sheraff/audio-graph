import openDB from "./open"

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

export async function dumpIndexedDB() {
	const dump = {}
	const databases = await indexedDB.databases()
	for (const {name, version} of databases) {
		if(!name) continue
		dump[name] = { _meta: { version, keys: {} } }
		const db = await openDB(name, version)
		for (const storeName of db.objectStoreNames) {
			dump[name][storeName] = []
			const tx = db.transaction(storeName, 'readonly')
			const store = tx.objectStore(storeName)
			dump[name]._meta.keys[storeName] = store.keyPath
			for await (const entry of iterateIndexedDBRequestCursor(store)) {
				dump[name][storeName].push(entry)
			}
		}
	}
	return dump
}

export async function restoreIndexedDB(dump) {
	for (const [name, {_meta, ...stores}] of Object.entries(dump)) {
		const db = await openDB(name, _meta.version)
		for (const [storeName, entries] of Object.entries(stores)) {
			const tx = db.transaction(storeName, 'readwrite')
			const store = tx.objectStore(storeName)
			for (const entry of entries) {
				store.add(entry)
			}
			tx.commit()
			await new Promise(resolve => tx.oncomplete = resolve)
		}
	}
}

export async function clearIndexedDB() {
	const databases = await indexedDB.databases()
	for (const {name} of databases) {
		if(!name) continue
		const db = await openDB(name)
		for (const storeName of db.objectStoreNames) {
			const tx = db.transaction(storeName, 'readwrite')
			const store = tx.objectStore(storeName)
			store.clear()
			tx.commit()
			await new Promise(resolve => tx.oncomplete = resolve)
		}
	}
}