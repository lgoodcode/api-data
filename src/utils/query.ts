import qs from 'qs'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function query(endpoint: string, options: { [key: string]: any }) {
	return `${endpoint}?${qs.stringify(options)}`
}
