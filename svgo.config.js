module.exports = {
	multipass: true,

	js2svg: {
		pretty: true,
		indent: '	',
	},

	plugins: [
		'collapseGroups',
		'removeDimensions',
		'removeStyleElement',
		'removeScriptElement',
		'removeRasterImages',
		'removeTitle',
		'removeMetadata',
		'removeDesc',
		'mergePaths',
		{
			name: 'cleanupNumericValues',
			params: {
				floatPrecision: 1,
			},
		},
		{
			name: 'convertPathData',
			params: {
				floatPrecision: 1,
			},
		},
		{
			name: 'convertShapeToPath',
			params: {
				floatPrecision: 1,
			},
		},
		{
			name: 'removeViewBox',
			active: false,
		},
		{
			name: 'removeAttrs',
			params: {
				attrs: [
					'id',
					'data-name',
				],
			},
		},
	],
}
