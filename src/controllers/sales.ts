import type { Request, Response } from 'express'
import dayjs, { type Dayjs } from 'dayjs'
import query from '../utils/query'
import request from '../utils/request'

type PaginationResponse = {
	RequestedLimit: number
	RequestedOffset: number
	PageSize: number
	TotalResults: number
}

type Sale = {
	Id: number
	SaleDate: string
	SaleTime: string
	SaleDateTime: string
	OriginalSaleDateTime: string
	SalesRepId?: number | null
	ClientId: string
	RecipientClientId?: number | null
	PurchasedItems: PurchasedItem[]
	LocationId: number
	Payments: Payment[]
}

type PurchasedItem = {
	SaleDetailId: number
	Id: number
	IsService: boolean
	BarcodeId: string
	Description: string
	ContractId?: number
	CategoryId: number
	SubCategoryId: number
	UnitPrice: number
	Quantity: number
	DiscountPercent: number
	DiscountAmount: number
	Tax1: number
	Tax2: number
	Tax3: number
	Tax4: number
	Tax5: number
	TaxAmount: number
	TotalAmount: number
	Notes?: string | null
	Returned: boolean
	PaymentRefId?: number
	ExpDate: string
	ActiveDate: string
}

type Payment = {
	Id: number
	Amount: number
	Method: number
	Type: string
	Notes: string
	TransactionId?: number
}

export type SalesApiResponse = {
	PaginationResponse: PaginationResponse
	Sales: Sale[]
}

export type SalesApiQuery = {
	StartSaleDateTime: string
	EndSaleDateTime: string
	limit?: number
	offset?: number
}

// This function allows the use of just a month name or a month number
// to default to the current year. Otherwise, Dayjs will default to 2001
const parseMonth = (month: string): Dayjs => {
	const m = month.toLowerCase().trim()
	// Check if the month is a number
	const num = parseInt(m)
	const isNum = !isNaN(num)

	return dayjs(`${new Date().getFullYear()}-${isNum ? num : m}-01`)
}

// -999 to +999
const RANGE_DAY = /^\-?[1-9](\d{1,2})?$/
// -36 to +36
const RANGE_MONTH = /^\-?[1-3]([1-6])?$/
// -3 to +3
// const RANGE_YEAR = /^\-?[1-3]$/

const ENDPOINT = 'https://api.mindbodyonline.com/public/v6/sale/sales'

// TODO: validate headers - make sure they aren't arrays
export default async function handler(req: Request, res: Response) {
	/**
	 * Check the api-key and other required headers
	 */

	const apiKey = req.headers['api-key'] as string
	const siteId = req.headers['siteid'] as string

	if (!apiKey) {
		return res.status(401).json({ error: 'Missing "Api-Key" header' })
	} else if (!siteId) {
		return res.status(401).json({ error: 'Missing "siteId" header' })
	}

	/**
	 * Determine the start and end dates
	 */

	const { limit, offset, start, end, day, month, property, range, flatten, meta } = req.query
	let prop: keyof Sale | [keyof Sale, keyof PurchasedItem] | [keyof Sale, keyof Payment] | undefined
	let startDate: Dayjs
	let endDate: Dayjs

	if (start || end) {
		if (!start) {
			return res.status(400).json({ error: 'Missing "start" date query' })
		} else if (!end) {
			return res.status(400).json({ error: 'Missing "end" date query' })
		}

		// Parse the strings into dates for Dayjs
		startDate = dayjs(start as string)
		endDate = dayjs(end as string)

		// Check if the dates are valid
		if (!startDate.isValid()) {
			return res.status(400).json({ error: 'Invalid "start" date query' })
		} else if (!endDate.isValid()) {
			return res.status(400).json({ error: 'Invalid "end" date query' })
		}
		/**
		 * Determine the range if the specifc dates are not provided
		 */
	} else {
		// Require a range for the days
		if (day && !range) {
			return res.status(400).json({ error: 'Missing the range' })
		} else if (day && range) {
			startDate = dayjs(day as string)

			if (!startDate.isValid()) {
				return res.status(400).json({ error: 'Invalid date' })
			}

			// Check if the range is valid
			if (!RANGE_DAY.test(range as string)) {
				return res.status(400).json({ error: 'Invalid range' })
			} else {
				endDate = startDate.add(parseInt(range as string), 'day').subtract(1, 'day')
			}
		} else if (month) {
			startDate = parseMonth(month as string)

			if (!startDate.isValid()) {
				return res.status(400).json({ error: 'Invalid month' })
			}

			if (range) {
				if (!RANGE_MONTH.test(range as string)) {
					return res.status(400).json({ error: 'Invalid range' })
				} else {
					endDate = startDate.add(parseInt(range as string), 'month').subtract(1, 'day')
				}
				// If no range was specified, default to the current month
			} else {
				endDate = startDate.endOf('month')
			}

			// Missing required timeframe
		} else {
			return res
				.status(400)
				.json({ error: 'Missing "start" and "end" date queries or "month" query' })
		}
	}

	/**
	 * If looking for a specific property, only return that property from the data
	 *
	 * TODO: allow case insensitive property names
	 */

	if (property) {
		const tokens = (property as string).split('.')
		const isPurchasedItems = Boolean(tokens[0].match(/PurchasedItems/i)?.length)
		const isPayments = Boolean(tokens[0].match(/Payments/i)?.length)

		// Can only define two levels deep
		if (tokens.length > 2) {
			return res.status(400).json({ error: `Invalid property: ${property}` })
			// If property is at the top level, set that property
		} else if (tokens.length === 1 && !isPurchasedItems && !isPayments) {
			prop = tokens[0] as keyof Sale
			//  Otherwise, the property is nested
		} else {
			if (isPurchasedItems) {
				prop = ['PurchasedItems', tokens[1] as keyof PurchasedItem]
			} else if (isPayments) {
				prop = ['Payments', tokens[1] as keyof Payment]
				// Invalid second level property
			} else {
				return res.status(400).json({ error: `Invalid property: ${property}` })
			}
		}
	}

	/**
	 * Get the parameters to make the requests
	 */

	const isBeforeEnd = startDate.isBefore(endDate)
	// Create an array of all the dates to query between the start and end
	const dates = Array.from({ length: endDate.diff(startDate, 'day') }, (_, i) => {
		if (isBeforeEnd) {
			return startDate.add(i, 'day')
		}
		return startDate.subtract(i, 'day')
	})
	const options = {
		headers: {
			'Content-Type': 'application/json',
			'Api-Key': apiKey,
			SiteId: siteId,
		},
	}
	const queryParams = (currDate: Dayjs, endDate: Dayjs): SalesApiQuery => ({
		StartSaleDateTime: currDate.toISOString(),
		EndSaleDateTime: endDate.toISOString(),
		limit: parseInt(limit as string) || 200,
		offset: parseInt(offset as string) || 0,
	})

	/**
	 * Perform the requests asynchronously
	 */

	const results = await Promise.all(
		dates.map(async (date) => {
			const end = isBeforeEnd ? date.add(1, 'day') : date.subtract(1, 'day')
			const qs = queryParams(date, end)
			const res = await request<SalesApiResponse>(query(ENDPOINT, qs), options)

			if ('error' in res) {
				return res
			}
			return res.Sales
		})
	)

	/**
	 * Perform specific property extraction on the data, if specified
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let data: any[]

	if (!prop) {
		data = results
	} else {
		data = results.map((sales) => {
			// Skip error objects
			if ('error' in sales) {
				return sales
			}

			const nestedData = []

			for (const sale of sales) {
				// If the property is at the top level, add the value to the results array
				if (prop && !Array.isArray(prop)) {
					nestedData.push(sale[prop])
					continue
				}

				// PurchasedItems nested property
				if (prop && prop[0] === 'PurchasedItems') {
					for (const item of sale.PurchasedItems) {
						nestedData.push(item[prop[1] as keyof PurchasedItem])
					}
					// Payments nested property
				} else if (prop && prop[0] === 'Payments') {
					for (const item of sale.Payments) {
						nestedData.push(item[prop[1] as keyof Payment])
					}
				}
			}

			return nestedData
		})
	}

	/**
	 * Create any meta data, if specified
	 */

	if (!meta) {
		res.json(flatten === 'true' ? data.flat() : data)
	} else {
		try {
			const metaKeys = !Array.isArray(meta) ? [meta] : meta
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const metaObj: { [key: string]: any } = {}

			if (metaKeys.includes('total')) {
				// The array can contain nested arrays, so add the length of it
				metaObj.total = data.reduce((acc, curr) => {
					if (Array.isArray(curr)) {
						return acc + curr.length
					}
					return acc + 1
				}, 0)
			}

			res.json({ meta: metaObj, data: flatten === 'true' ? data.flat() : data })
		} catch (err) {
			res.json({ error: 'Invalid meta', data })
		}
	}
}
