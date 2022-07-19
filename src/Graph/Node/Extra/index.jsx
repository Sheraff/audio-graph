import Analyser from './Analyser'
import Visualizer from './Visualizer'

export default function Extra({type, instance, ...rest}) {
	if (type === 'visualizer')
		return <Visualizer {...rest} instance={instance} />
	if (type === 'analyser')
		return <Analyser {...rest} instance={instance} />
	return null
}