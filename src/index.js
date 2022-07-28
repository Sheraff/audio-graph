import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import Graph from './Graph'
import request from './Graph/Files/request'

if (localStorage.length === 0) {
	request(`${process.env.PUBLIC_URL}/example.sheraff`)
		.then(startApp)
} else {
	startApp()
}


function startApp() {
	const root = ReactDOM.createRoot(document.getElementById('root'))
	root.render(
		<Graph />
	)
}
