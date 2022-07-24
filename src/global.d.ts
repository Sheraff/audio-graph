declare module '*.module.less' {
	const classes: { [key: string]: string }
	export default classes
}

declare const process: {
	env: {
		PUBLIC_URL: string
	}
}