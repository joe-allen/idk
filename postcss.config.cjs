const OpenProps = require('open-props');
const autoprefixer = require('autoprefixer');
const postcssJitProps = require('postcss-jit-props');
const postcssPresetEnv = require('postcss-preset-env')
// const postcssCustomMedia = require('postcss-custom-media');
// const purgecss = require('@fullhuman/postcss-purgecss')

const config = {
	plugins: [
		autoprefixer,
		postcssJitProps(OpenProps),
		postcssPresetEnv({
      stage: 3,
      features: {
        'nesting-rules': true,
        'custom-media-queries': true,
        'media-query-ranges': true
      }
		})
		// purgecss({
		// 		content: ['./**/*.svelte']
		// })
	]
};

module.exports = config;
