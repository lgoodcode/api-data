import express from 'express'
import compression from 'compression'
import router from './router'

const app = express()

// Disable the express header for security
app.disable('x-powered-by')

app.use(compression())
// Parse JSON and form data in req.body
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use('/api', router)

// Error handler for promises - silently catch
process.on('uncaughtException', (err) => {
	console.error(`[Uncaught Error]:\n${err.stack}`)
	process.exit(1)
})

export default app
