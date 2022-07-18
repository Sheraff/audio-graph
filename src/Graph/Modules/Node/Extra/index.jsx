import Visualizer from './Visualizer'

export default function Extra({type, id, nodeId, instance, ...rest}) {
	if (type === 'visualizer')
		return <Visualizer {...rest} id={id} nodeId={nodeId} instance={instance} />
	return null
}