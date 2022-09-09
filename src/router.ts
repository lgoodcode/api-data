import express, { type Request, type Response, type NextFunction } from 'express'
import axios from 'axios'
import qs from 'qs'
const router = express.Router()

export default router
	.get('/v1/sales', async (req, res) => {
		const endpoint = 'https://api.mindbodyonline.com/public/v6/sale/sales'
		// const { start, end } = req.query
		try {
			const query = `${endpoint}?${qs.stringify({
				limit: 200,
				offset: 0,
				startDateTime: '2022-07-01T00:00:00Z',
				endDateTime: '2022-08-01T00:00:00Z',
			})}`

			const { data, status, statusText } = await axios(query, {
				headers: {
					'Content-Type': 'application/json',
					'Api-Key': 'f777669bdf51470e9b063ad3973bdb5d',
					SiteId: '529254',
				},
			})

			if (status >= 400) {
				return res.json({
					error: true,
					message: 'Error fetching sales',
					description: statusText,
				})
			}

			return res.json(data)
		} catch (err) {
			console.error(err)
			return res.json({ error: true, message: 'Error fetching sales' })
		}
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
