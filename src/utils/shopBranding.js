export function resolveShopBranding(cartData, apiBranding = {}) {
  return {
    shopName: cartData?.shopName || apiBranding.shopName || null,
    shopLogoUrl: cartData?.shopLogoUrl || apiBranding.shopLogoUrl || null,
  }
}
