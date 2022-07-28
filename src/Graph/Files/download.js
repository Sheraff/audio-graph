import { dumpIndexedDB } from "../Database/dump"
import { compress } from "./gzip"

export default async function downloadGraph() {
	const dbDump = await dumpIndexedDB()
	const lsDump = {...localStorage}
	const data = {
		indexedDB: dbDump,
		localStorage: lsDump,
	}

	console.log(data)

	const string = JSON.stringify(data)
	const compressed = await compress(string, 'gzip')

	const blob = new Blob([compressed], { type: "application/octet-stream" })
	const link = document.createElement("a")

	link.download = "graph.sheraff"
	link.href = window.URL.createObjectURL(blob)
	link.dataset.downloadurl = ["application/octet-stream", link.download, link.href].join(":")

	const evt = new MouseEvent("click", {
		view: window,
		bubbles: true,
		cancelable: true,
	})

	link.dispatchEvent(evt)
	link.remove()
}