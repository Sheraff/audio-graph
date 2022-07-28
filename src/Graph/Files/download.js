import { dumpIndexedDB } from "../Database/dump"

export default async function downloadGraph() {
	const dbDump = await dumpIndexedDB()
	const lsDump = {...localStorage}
	const data = {
		indexedDB: dbDump,
		localStorage: lsDump,
	}

	console.log(data)

	const blob = new Blob([JSON.stringify(data)], { type: "text/json" })
	const link = document.createElement("a")

	link.download = "graph.json"
	link.href = window.URL.createObjectURL(blob)
	link.dataset.downloadurl = ["text/json", link.download, link.href].join(":")

	const evt = new MouseEvent("click", {
		view: window,
		bubbles: true,
		cancelable: true,
	})

	link.dispatchEvent(evt)
	link.remove()
}