export default function Setting({name, type, defaultValue, value, options, props}) {
	if (type === 'select')
		return (
			<div>
				<label>
					{name}
					<select name={name} {...props} defaultValue={defaultValue}>
						{options.map(option => (
							<option key={option} value={option}>{option}</option>
						))}
					</select>
				</label>
			</div>
		)
	return (
		<div>
			<label>
				{name}
				<input type={type} name={name} defaultValue={defaultValue} {...props}/>
				{value}
			</label>
		</div>
	)
}