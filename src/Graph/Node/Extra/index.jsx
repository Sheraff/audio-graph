import Analyser from './Analyser'
import BalanceDisplay from './BalanceDisplay'
import Text from './Text'
import Visualizer from './Visualizer'
import Waveform from './Waveform'

export default function Extra({type, instance, ...rest}) {
	if (type === 'visualizer')
		return <Visualizer {...rest} instance={instance} />
	if (type === 'analyser')
		return <Analyser {...rest} instance={instance} />
	if (type === 'waveform')
		return <Waveform {...rest} instance={instance} />
	if (type === 'balance-display')
		return <BalanceDisplay {...rest} instance={instance} />
	if (type === 'text')
		return <Text {...rest} />
	return null
}