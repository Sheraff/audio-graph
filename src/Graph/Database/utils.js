import openDB from "./open"

export async function storeBufferInIndexedDB(id, buffer) {
	const db = await openDB()
	const tx = db.transaction("buffers", "readwrite")
	const store = tx.objectStore("buffers")
	const request = store.put({id, buffer})
	request.onerror = () => {
		console.error(`failed to store buffer ${id} in indexedDB`, request.error?.message)
	}
}

export async function retrieveBufferFromIndexedDB(id) {
	const db = await openDB()
	const tx = db.transaction("buffers")
	const store = tx.objectStore("buffers")
	const request = store.get(id)
	return new Promise((resolve, reject) => {
		request.onerror = () => {
			console.error(`failed to retrieve buffer ${id} from indexedDB`, request.error?.message)
			reject(request.error)
		}
		request.onsuccess = () => {
			resolve(request.result?.buffer)
		}
	})
}

export async function deleteBufferFromIndexedDB(id) {
	const db = await openDB()
	const tx = db.transaction("buffers", "readwrite")
	const store = tx.objectStore("buffers")
	store.delete(id)
}