type NodeUuid = string

interface Setting {
	type: 'string'
	readFrom: 'string'
	defaultValue: any
	event?: 'input' | 'change'
}

interface Structure {
	slots:
		{type: 'input', name: number}
		| {type: 'output', name: number}
		| {type: 'setting', name: string}
		| {type: 'custom', name: string}
	settings: {
		[name: string]: Setting
	}
	extras: Array<{type: string, name: number} & {[key: string]: any}>
}

type SettingRecord<TStruct extends Structure, TKey extends keyof TStruct['settings']> = {
	[name: TKey]: TStruct['settings'][TKey]['defaultValue']
}

type FromSlot = Structure['slots'] & {type: 'output'}
type ToSlot = Structure['slots'] & {type: 'input' | 'setting' | 'custom'}
type ConnectionReference<T extends FromSlot | ToSlot> = {
	nodeUuid: NodeUuid
	slot: T
}
type Connection = {
	from: ConnectionReference<FromSlot>
	to: ConnectionReference<ToSlot>
}
type SlotId<T extends ConnectionReference<FromSlot | ToSlot>> = `${T["nodeUuid"]}.${T["slot"]["type"]}.${T["slot"]["name"]}`
type ConnectionId = `${SlotId<Connection["from"]>}-${SlotId<Connection["to"]>}`

interface AnyNode extends AudioNode {}

interface GraphAudioNode<
	TType extends string,
	TStruct extends Structure,
	TNode extends AnyNode,
	TCustomNodes extends {[key: string]: AnyNode},
> {
	type: TType
	image: `${typeof process.env.PUBLIC_URL}/${string}.${'svg' | 'png'}`
	structure: TStruct
	requiredModules: Array<`${typeof process.env.PUBLIC_URL}/${string}.js`>
	isSink: boolean
	requiresSinkToPlay: boolean

	id: NodeUuid
	audioContext: AudioContext | null
	audioNode: TNode | null
	customNodes: TCustomNodes
	observableNodes: {
		[name: string]: ConstantSourceNode & {
			offset: AudioParam & {
				observer: AnalyserNode
			}
		}
	}
	establishedConnections: Set<ConnectionId>
	hasAudioDestination: boolean
	eventTarget: EventTarget | null
	ricId: number | null
	controller: AbortController

	data: {
		type: TType
		dom: {x: number, y: number}
		connections: Array<ConnectionId>
		extra: {[key: string]: any}
		settings: SettingRecord<TStruct, keyof TStruct['settings']>
	}

	constructor(
		id: NodeUuid,
		audioContext: string | AudioContext,
		initialPosition?: {x: number, y: number}
	): GraphAudioNode<TType,TStruct,TNode,TCustomNodes>

	ownNodeConnection(
		action: 'connect' | 'disconnect',
		from: ConnectionReference<FromSlot>,
		to: ConnectionReference<ToSlot>,
		audioNode: AnyNode
	): void

	getDestinationAudioNode(
		connection: ConnectionReference<ToSlot>
	): TNode | AudioParam | null

	obtainAudioContext(
		audioContext: string | AudioContext
	): void

	initializeAudioNodes(
		audioContext: AudioContext
	): void

	updateSetting(
		name: keyof TStruct['settings']
	): void

	makeParamObservable(
		name: TNode extends AudioWorkletNode 
			? string 
			: TNode[keyof TNode] extends AudioParam 
				? keyof TNode
				: never
	): void
}