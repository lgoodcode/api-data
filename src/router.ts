import express, { type Request, type Response, type NextFunction } from 'express'
// import { check } from 'express-validator'
// import sendEmail from './controllers/email'
// import { getCourses, getCourseById } from './controllers/courses'
// import { getProducts, getProductById } from './controllers/products'
const router = express.Router()

export default router
	.get('/test', (req, res) => {
		res.json({ message: 'Hello World!' })
	})
	// .get('/courses', getCourses)
	// .get('/courses/:id', getCourseById)
	// .get('/products', getProducts)
	// .get('/products/:id', getProductById)
	// .post(
	// 	'/contact',
	// 	[
	// 		check('firstName').isLength({ min: 1 }).trim().escape(),
	// 		check('lastName').isLength({ min: 1 }).trim().escape(),
	// 		check('email').isEmail().normalizeEmail(),
	// 		check('phone').isMobilePhone('en-US'),
	// 		check('message').isLength({ min: 1 }).trim().escape(),
	// 	],
	// 	sendEmail
	// )
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	.use((err: Error, req: Request, res: Response, next: NextFunction) => {
		console.error(err)
		res.status(403).send(err.message)
	})
