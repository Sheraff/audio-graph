import openDB from "./open"

export async function storeBufferInIndexedDB(id, buffer) {
	const db = await openDB()
	const tx = db.transaction("buffers", "readwrite")
	const store = tx.objectStore("buffers")
	const request = store.put({id, buffer})
	tx.oncomplete = () => {
		console.log(`storage transaction complete`)
	}
	request.onerror = () => {
		console.error(`failed to store buffer ${id} in indexedDB`, request.error?.message)
	}
	request.onsuccess = () => {
		console.log(`stored buffer ${id} in indexedDB`)
	}
}

export async function retrieveBufferFromIndexedDB(id) {
	const db = await openDB()
	const tx = db.transaction("buffers")
	const store = tx.objectStore("buffers")
	const request = store.get(id)
	tx.oncomplete = () => {
		console.log(`retrieval transaction complete`)
	}
	return new Promise((resolve, reject) => {
		request.onerror = () => {
			console.error(`failed to retrieve buffer ${id} from indexedDB`, request.error?.message)
			reject(request.error)
		}
		request.onsuccess = () => {
			console.log(`retrieved buffer ${id} from indexedDB`)
			resolve(request.result?.buffer)
		}
	})
}

export async function deleteBufferFromIndexedDB(id) {
	const db = await openDB()
	const tx = db.transaction("buffers", "readwrite")
	const store = tx.objectStore("buffers")
	const request = store.delete(id)
	tx.oncomplete = () => {
		console.log(`deletion transaction complete`)
	}
	request.onerror = () => {
		console.error(`failed to delete buffer ${id} from indexedDB`, request.error?.message)
	}
	request.onsuccess = () => {
		console.log(`deleted buffer ${id} from indexedDB`)
	}
}