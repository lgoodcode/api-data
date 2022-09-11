import axios, { AxiosRequestConfig } from 'axios'

export default async function request<T>(url: string, options: AxiosRequestConfig<T> | undefined) {
	try {
		const { data, status, statusText } = await axios.get<T>(url, options)

		// Check if request failed
		if (status >= 400) {
			return {
				error: 'Failed to fetch',
				url,
				status,
				statusText,
			}
		}

		return data
	} catch (err) {
		console.error('Error fetching data')

		return {
			error: 'Error occurred when fetching',
			url,
		}
	}
}
