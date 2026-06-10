import { useState, useEffect } from 'react'

const CART_TIMEOUT_MS = 4000

function buildStaticCart(shop) {
  return {
    shop: shop || 'new-dev-ailovmic.myshopify.com',
    items: [
      {
        variantId: 123456,
        productId: 789012,
        title: 'Kanjivaram Silk Zari Half Saree Lehenga With Blouse Along With Banarsi Silk Dupatta',
        variantTitle: 'Free Size',
        quantity: 1,
        price: 99900,
        compareAtPrice: 199800,
        originalPrice: 199800,
        totalDiscount: 99900,
        image: null,
        sku: 'KSL-001',
      },
    ],
    itemCount: 1,
    totalPrice: 99900,
    originalTotalPrice: 199800,
    currency: 'INR',
  }
}

// Receives cart data sent via postMessage from the Shopify storefront
export function useCartBridge() {
  const [cartData, setCartData] = useState(null)
  const [shop, setShop] = useState(null)
  const [cartLoading, setCartLoading] = useState(true)
  const [isStaticCart, setIsStaticCart] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const shopParam = params.get('shop')
    if (shopParam) setShop(shopParam)

    const isInIframe = window.parent !== window
    let received = false

    function markReady(payload, staticFallback = false) {
      received = true
      setCartData(payload)
      setCartLoading(false)
      setIsStaticCart(staticFallback)
      if (payload.shop) setShop(payload.shop)
    }

    function handleMessage(event) {
      if (event.data && event.data.type === 'MOON_CART_DATA') {
        markReady(event.data.payload, false)
      }
    }

    window.addEventListener('message', handleMessage)

    if (isInIframe) {
      window.parent.postMessage({ type: 'MOON_CHECKOUT_READY' }, '*')
      ;[300, 800, 1500, 2500].forEach((ms) => {
        setTimeout(() => {
          if (!received) {
            window.parent.postMessage({ type: 'MOON_CHECKOUT_READY' }, '*')
          }
        }, ms)
      })
    }

    const fallbackTimer = setTimeout(() => {
      if (received) return
      console.warn('Moon Checkout: cart data not received, using static demo cart')
      markReady(buildStaticCart(shopParam), true)
    }, import.meta.env.DEV ? 1500 : CART_TIMEOUT_MS)

    return () => {
      window.removeEventListener('message', handleMessage)
      clearTimeout(fallbackTimer)
    }
  }, [])

  return { cartData, shop, cartLoading, isStaticCart }
}
