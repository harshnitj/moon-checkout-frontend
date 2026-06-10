import http from './http'

export async function trackFunnelEvent(payload) {
  try {
    const res = await http.post('/api/checkout/funnel/track', payload)
    return res.data
  } catch (err) {
    console.warn('Funnel track failed:', err?.response?.data?.error || err.message)
    return null
  }
}
