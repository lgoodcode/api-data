import chalk from 'chalk'
import TerserPlugin from 'terser-webpack-plugin'
import nodeExternals from 'webpack-node-externals'
import ProgressBarPlugin from 'progress-bar-webpack-plugin'
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin'
import type { Configuration } from 'webpack'
import paths from './paths'

const config = (webpackEnv: 'development' | 'production') => {
	const isDevelopment = webpackEnv === 'development'
	const isProduction = webpackEnv === 'production'

	return {
		target: 'node',
		mode: webpackEnv,
		entry: isProduction ? paths.appEntry : ['webpack/hot/dev-server', paths.appEntry],
		watch: isDevelopment,
		devtool: process.env.DEBUG_PROD === 'true' ? 'source-map' : false,
		cache: { type: 'filesystem' },
		output: {
			path: paths.appBuild,
			// The output file is static for development and build since it is
			// a single point of entry for the app
			filename: 'main.js',
		},
		externals: [nodeExternals()],
		optimization: {
			minimize: isProduction,
			minimizer: [
				new TerserPlugin({
					parallel: true,
					minify: TerserPlugin.swcMinify,
				}),
			],
		},
		resolve: {
			modules: ['node_modules'],
			extensions: ['.js', '.ts'],
		},
		module: {
			rules: [
				{
					test: /\.ts$/,
					exclude: /node_modules/,
					use: 'swc-loader',
				},
			],
		},
		plugins: [
			isProduction &&
				new ProgressBarPlugin({
					total: 100,
					format: `${chalk.green.bold('building...')} ${chalk.cyan(
						'[:bar]'
					)} [:percent] [:elapsed seconds] - :msg`,
				}),
			new ForkTsCheckerWebpackPlugin(),
		].filter(Boolean),
	} as Configuration
}

export default config
