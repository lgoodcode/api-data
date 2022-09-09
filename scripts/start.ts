import { config as dotenv } from 'dotenv'
import webpack, { type Configuration } from 'webpack'
import webpackDevServer from 'webpack-dev-server'
import chalk from 'chalk'
import config from '../config/webpack.config'
import { spawn } from 'child_process'

dotenv({ path: '.env.local' })

const compiler = webpack(config('development') as Configuration, (err, stats) => {
	if (err) {
		console.error(err.stack || err)

		if (err.message) {
			console.error(err.message)
		}
		return
	}

	if (stats) {
		const info = stats.toJson()

		if (stats && stats.hasErrors()) {
			console.error(info.errors)
			process.exit()
		}

		if (stats && stats.hasWarnings()) {
			console.warn(info.warnings)
		}
	}
})

const devServerOptions: webpackDevServer.Configuration = {
	host: 'localhost',
	hot: true,
	compress: true,
	open: true,
	port: 8000,
	headers: { 'Access-Control-Allow-Origin': '*' },
	static: {
		publicPath: '/',
	},
	historyApiFallback: {
		verbose: true,
	},
}

const startServer = async () => {
	console.log(chalk.cyan('Starting webpack development server...'))
	await new webpackDevServer(devServerOptions, compiler).start()

	console.log(chalk.cyan('Starting development server...'))

	const server = spawn('nodemon', ['src/server.ts'], {
		shell: true,
		stdio: 'inherit',
	})

	server.on('error', console.error)
}

startServer()
