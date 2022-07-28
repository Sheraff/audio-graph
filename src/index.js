import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import Graph from './Graph'
import { restoreIndexedDB } from './Graph/Database/dump'

if (localStorage.length === 0) {
	fetch(`${process.env.PUBLIC_URL}/example.json`)
		.then(res => res.json())
		.then(async data => {
			console.log('restoring from example.json')
			const {
				indexedDB: dbDump,
				localStorage: lsDump,
			} = data
			console.log('restoring indexedDB')
			await restoreIndexedDB(dbDump)
			console.log('restoring localStorage')
			Object.entries(lsDump).forEach(([key, value]) => {
				localStorage.setItem(key, value)
			})
			console.log('restoring complete')
		})
		.then(() => {
			console.log('Restored from example.json')
			startApp()
		})
} else {
	console.log('hello')
	startApp()
}


function startApp() {
	const root = ReactDOM.createRoot(document.getElementById('root'))
	root.render(
		<Graph />
	)
}
