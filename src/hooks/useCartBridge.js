import { useState, useEffect } from 'react'

// Receives cart data sent via postMessage from the Shopify storefront
export function useCartBridge() {
  const [cartData, setCartData] = useState(null)
  const [shop, setShop] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const shopParam = params.get('shop')
    if (shopParam) setShop(shopParam)

    const isInIframe = window.parent !== window
    let received = false

    function handleMessage(event) {
      if (event.data && event.data.type === 'MOON_CART_DATA') {
        received = true
        const payload = event.data.payload
        setCartData(payload)
        if (payload.shop) setShop(payload.shop)
      }
    }

    window.addEventListener('message', handleMessage)

    // Tell parent (Shopify storefront) that iframe is ready to receive cart data
    if (isInIframe) {
      window.parent.postMessage({ type: 'MOON_CHECKOUT_READY' }, '*')
      // Retry ready signal in case parent listener wasn't attached yet
      ;[300, 800, 1500].forEach((ms) => {
        setTimeout(() => {
          if (!received) {
            window.parent.postMessage({ type: 'MOON_CHECKOUT_READY' }, '*')
          }
        }, ms)
      })
    }

    // DEV MODE: mock cart only when opened directly (not inside Shopify iframe)
    const devTimer = setTimeout(() => {
      if (!received && !isInIframe && import.meta.env.DEV) {
        setCartData({
          shop: shopParam || 'new-dev-ailovmic.myshopify.com',
          items: [
            {
              variantId: 123456,
              productId: 789012,
              title: 'Kanjivaram Silk Zari Half Saree Lehenga With Blouse Along With Banarsi Silk Dupatta',
              variantTitle: 'Free Size',
              quantity: 1,
              price: 99900,
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
        })
      }
    }, 2000)

    return () => {
      window.removeEventListener('message', handleMessage)
      clearTimeout(devTimer)
    }
  }, [])

  return { cartData, shop }
}
