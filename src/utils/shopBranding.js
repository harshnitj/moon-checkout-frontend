function isValidShopLogoUrl(url) {
  if (!url || typeof url !== 'string') return false
  const lower = url.toLowerCase()
  if (lower.includes('cover_image')) return false
  if (lower.includes('theme_cover')) return false
  return true
}

function pickShopLogoUrl(...candidates) {
  for (const url of candidates) {
    if (isValidShopLogoUrl(url)) return url
  }
  return null
}

export function resolveShopBranding(cartData, apiBranding = {}) {
  return {
    shopName: cartData?.shopName || apiBranding.shopName || null,
    shopLogoUrl: pickShopLogoUrl(cartData?.shopLogoUrl, apiBranding.shopLogoUrl),
  }
}
