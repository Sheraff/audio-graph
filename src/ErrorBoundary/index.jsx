// https://reactjs.org/docs/error-boundaries.html
import React from "react"

export default class ErrorBoundary extends React.Component {
	constructor(props) {
		super(props)
		this.state = { hasError: false }
	}
	
	static getDerivedStateFromError(error) {
		// Update state so the next render will show the fallback UI.
		return { hasError: true, message: error.toString() }
	}
	
	componentDidCatch(error, errorInfo) {
		// You can also log the error to an error reporting service
		console.error(error, errorInfo)
	}
	
	render() {
		if (this.state.hasError) {
			// You can render any custom fallback UI
			return (
				<div style={{
					margin: 'auto',
					padding: '2em',
					maxWidth: '600px',
				}}>
					<h1>Something went wrong.</h1>
					<p>The code is still evolving and you might have locally stored data from an older version.</p>
					<p>To continue, please re-open in an incognito window or clear this application's data (video below) and reload the page.</p>
					<p>If the issue persists, <a href="https://github.com/Sheraff/audio-graph/issues/new" style={{color: '#ab7ae7'}}>please tell me</a>.</p>
					<video
						playsInline
						muted
						loop
						autoPlay
						controls
						style={{
							width: '100%',
							height: 'auto',
						}}
					>
						<source src={`${process.env.PUBLIC_URL}/clear-site-data.mp4`} type="video/mp4" />
						<source src={`${process.env.PUBLIC_URL}/clear-site-data.mov`} type="video/quicktime" />
					</video>
					<pre style={{
						background: '#422',
						padding: '1em',
					}}>
						{this.state.message}
					</pre>
				</div>
			)
		}
	
		return this.props.children
	}
}