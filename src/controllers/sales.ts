import type { Request, Response } from 'express'
import axios from 'axios'
import qs from 'qs'
import dayjs from 'dayjs'

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

export default async function handler(req: Request, res: Response) {
	const endpoint = 'https://api.mindbodyonline.com/public/v6/sale/sales'
	const apiKey = req.headers['api-key'] as string
	const siteId = req.headers['siteid'] as string

	if (!apiKey) {
		return res.status(401).json({ error: true, message: 'Missing API key header' })
	} else if (!siteId) {
		return res.status(401).json({ error: true, message: 'Missing site ID header' })
	}

	const { limit = 200, offset = 0, start, end, property, meta } = req.query
	const finalDate = new Date(end as string)
	const results = []
	let currDate = start as string
	let total = 0
	let prop: keyof Sale | [keyof Sale, keyof PurchasedItem] | [keyof Sale, keyof Payment] | undefined

	if (!start) {
		return res.status(400).json({ error: true, message: 'Missing start date query' })
	} else if (!end) {
		return res.status(400).json({ error: true, message: 'Missing end date query' })
	}

	// If looking for a specific property, only return that property
	if (property) {
		const tokens = (property as string).split('.')
		const isPurchasedItems = Boolean(tokens[0].match(/PurchasedItems/i)?.length)
		const isPayments = Boolean(tokens[0].match(/Payments/i)?.length)

		// Can only define two levels deep
		if (tokens.length > 2) {
			return res.status(400).json({ error: true, message: `Invalid property: ${property}` })
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
				return res.status(400).json({ error: true, message: `Invalid property: ${property}` })
			}
		}
	}

	const query = (startDate: string) =>
		`${endpoint}?${qs.stringify({
			limit,
			offset,
			startSaleDateTime: startDate,
			endSaleDateTime: dayjs(startDate).add(1, 'day').toISOString(),
		})}`

	while (new Date(currDate) < finalDate) {
		try {
			const { data, status, statusText } = await axios.get<SalesApiResponse>(query(currDate), {
				headers: {
					'Content-Type': 'application/json',
					'Api-Key': apiKey,
					SiteId: siteId,
				},
			})

			// Check if request failed
			if (status >= 400) {
				return res.json({
					error: true,
					message: 'Error fetching sales',
					description: statusText,
				})
			}

			// If not looking for a specific property, add the data to the results array
			if (!prop) {
				results.push(...data.Sales)
				// Find the property value
			} else {
				for (const sale of data.Sales) {
					// If the property is at the top level, add the value to the results array
					if (!Array.isArray(prop)) {
						if (sale[prop] === undefined) {
							return res.json({ error: true, message: `Invalid property: ${prop}` })
						}

						results.push(sale[prop])
					} else {
						// PurchasedItems nested property
						if (prop[0] === 'PurchasedItems') {
							for (const item of sale.PurchasedItems) {
								const key = prop[1] as keyof PurchasedItem

								if (item[key] === undefined) {
									return res.json({ error: true, message: `Invalid property: ${prop[1]}` })
								}
								results.push(item[key])
							}
							// Payments nested property
						} else {
							for (const item of sale.Payments) {
								const key = prop[1] as keyof Payment

								if (item[key] === undefined) {
									return res.json({ error: true, message: `Invalid property: ${prop[1]}` })
								}
								results.push(item[key])
							}
						}
					}
				}
			}

			total += data.PaginationResponse.TotalResults

			currDate = dayjs(currDate).add(1, 'day').toISOString()
		} catch (err) {
			console.error(err)
			return res.json({ error: true, message: 'Error fetching sales' })
		}
	}

	if (!meta) {
		return res.json(results)
	} else {
		return res.json({ meta: { totalSales: total }, data: results })
	}
}
