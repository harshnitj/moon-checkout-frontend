import http from './http'

export async function trackServerMarketingEvent({
  shop,
  event,
  eventId,
  payload,
  userData,
}) {
  if (!shop || !event || !eventId) return null

  try {
    const res = await http.post('/api/marketing/track', {
      shop,
      event,
      eventId,
      payload,
      userData,
    })
    return res.data
  } catch (err) {
    console.error('Server marketing track failed:', err)
    return null
  }
}
