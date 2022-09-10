import express, { type Request, type Response, type NextFunction } from 'express'
import morgan from 'morgan'
import compression from 'compression'
import router from './router'

const app = express()

// Disable the express header for security
app.disable('x-powered-by')

app.use(morgan('combined'))

app.use(compression())
// Parse JSON and form data in req.body
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use('/api', router)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
	console.error(err)
	res.status(404).json({ error: 'Not found' })
})

// Error handler for promises - silently catch
process.on('uncaughtException', (err) => {
	console.error(`[Uncaught Error]:\n${err.stack}`)
	process.exit(1)
})

export default app
