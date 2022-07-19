import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import Graph from './Graph'
import example from './Graph/example'

if (localStorage.length === 0) {
	Object.entries(example).forEach(([key, value]) => {
		localStorage.setItem(key, value)
	})
}

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
	<Graph />
)
