import Visualizer from './Visualizer'

export default function Extra({type, id, instance, ...rest}) {
	if (type === 'visualizer')
		return <Visualizer {...rest} id={id} instance={instance} />
	return null
}