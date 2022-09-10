// Do this as the first thing so that any code reading it knows the right env.
process.env.NODE_ENV = 'production'

import '../config/env'
import chalk from 'chalk'
import webpack, { Configuration } from 'webpack'
import config from '../config/webpack.config'

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', (err) => {
	throw err
})

console.clear()
console.log(chalk.yellow('Creating an optimized production build...\n'))

webpack(config('production') as Configuration, (err, stats) => {
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

	;['SIGINT', 'SIGTERM'].forEach((sig) => {
		process.on(sig, function () {
			process.exit()
		})
	})

	console.log(chalk.green('Build successful!'))
})
