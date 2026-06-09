import http from './http'

export async function fetchCheckoutConfig(shop) {
  const res = await http.get('/api/checkout/config', {
    params: { shop },
  })
  return res.data.settings
}
