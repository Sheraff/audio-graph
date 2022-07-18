import Visualizer from './Visualizer'

export default function Extra({type, instance, ...rest}) {
	if (type === 'visualizer')
		return <Visualizer {...rest} instance={instance} />
	return null
}