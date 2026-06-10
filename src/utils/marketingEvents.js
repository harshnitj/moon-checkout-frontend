import { trackServerMarketingEvent } from '../services/marketing'

const loadedMetaPixelId = { current: null }
const loadedGoogleAdsId = { current: null }
const trackedInitiateCheckout = { current: false }
const trackedAddPaymentInfo = { current: false }

function createEventId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `mc_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function getCurrency(cartData) {
  return cartData?.currency || 'INR'
}

function getCartValue(cartData) {
  return (cartData?.totalPrice || 0) / 100
}

function buildLineItems(cartData) {
  return (cartData?.items || []).map((item) => ({
    id: String(item.variantId),
    name: item.title,
    quantity: item.quantity,
    item_price: (item.price || 0) / 100,
  }))
}

function buildMetaPayload(cartData, extra = {}) {
  const items = buildLineItems(cartData)
  return {
    value: getCartValue(cartData),
    currency: getCurrency(cartData),
    content_ids: items.map((item) => item.id),
    contents: items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      item_price: item.item_price,
    })),
    num_items: cartData?.itemCount || items.length,
    ...extra,
  }
}

function buildGoogleItems(cartData) {
  return (cartData?.items || []).map((item) => ({
    item_id: String(item.variantId),
    item_name: item.title,
    quantity: item.quantity,
    price: (item.price || 0) / 100,
  }))
}

function buildUserData({ email, phone } = {}) {
  return {
    email: email || undefined,
    phone: phone || undefined,
    fbp: getCookie('_fbp') || undefined,
    fbc: getCookie('_fbc') || undefined,
    eventSourceUrl: window.location.href,
    clientId: getCookie('_ga')?.replace(/^GA\d+\.\d+\./, '') || undefined,
  }
}

function notifyParent(event, payload) {
  if (window.parent === window) return
  window.parent.postMessage(
    {
      type: 'MOON_CHECKOUT_MARKETING_EVENT',
      event,
      payload,
    },
    '*',
  )
}

async function sendServerEvent({
  shop,
  settings,
  eventName,
  eventId,
  payload,
  userData,
}) {
  if (!shop) return
  if (!settings.metaCapiEnabled && !settings.googleCapiEnabled) return

  await trackServerMarketingEvent({
    shop,
    event: eventName,
    eventId,
    payload,
    userData,
  })
}

function loadMetaPixel(pixelId) {
  if (!pixelId || loadedMetaPixelId.current === pixelId) return

  if (!window.fbq) {
    const scriptId = 'moon-meta-pixel'
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script')
      script.id = scriptId
      script.async = true
      script.src = 'https://connect.facebook.net/en_US/fbevents.js'
      document.head.appendChild(script)

      window.fbq = function fbq() {
        window.fbq.callMethod
          ? window.fbq.callMethod.apply(window.fbq, arguments)
          : window.fbq.queue.push(arguments)
      }
      window.fbq.push = window.fbq
      window.fbq.loaded = true
      window.fbq.version = '2.0'
      window.fbq.queue = []
    }
  }

  window.fbq('init', pixelId)
  window.fbq('track', 'PageView')
  loadedMetaPixelId.current = pixelId
}

function loadGoogleAds(googleAdsId) {
  if (!googleAdsId || loadedGoogleAdsId.current === googleAdsId) return

  window.dataLayer = window.dataLayer || []
  if (!window.gtag) {
    window.gtag = function gtag() {
      window.dataLayer.push(arguments)
    }
  }

  const scriptId = 'moon-google-ads'
  if (!document.getElementById(scriptId)) {
    const script = document.createElement('script')
    script.id = scriptId
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(googleAdsId)}`
    document.head.appendChild(script)
  }

  window.gtag('js', new Date())
  window.gtag('config', googleAdsId)
  loadedGoogleAdsId.current = googleAdsId
}

export function initMarketingPixels(settings = {}) {
  if (settings.metaAdsEnabled && settings.metaPixelId) {
    loadMetaPixel(settings.metaPixelId)
  }
  if (settings.googleAdsEnabled && settings.googleAdsId) {
    loadGoogleAds(settings.googleAdsId)
  }
}

export async function trackMarketingInitiateCheckout(settings = {}, cartData, context = {}) {
  if (!cartData || trackedInitiateCheckout.current) return null
  trackedInitiateCheckout.current = true

  const eventId = createEventId()
  const payload = buildMetaPayload(cartData)
  const userData = buildUserData(context)

  notifyParent('InitiateCheckout', { ...payload, event_id: eventId })

  if (settings.metaAdsEnabled && settings.metaPixelEventInitiateCheckout && settings.metaPixelId && window.fbq) {
    window.fbq('track', 'InitiateCheckout', payload, { eventID: eventId })
  }

  if (settings.googleAdsEnabled && settings.googlePixelEventInitiateCheckout && settings.googleAdsId && window.gtag) {
    window.gtag('event', 'begin_checkout', {
      currency: getCurrency(cartData),
      value: getCartValue(cartData),
      items: buildGoogleItems(cartData),
    })

    if (settings.googleAdsCheckoutLabel) {
      window.gtag('event', 'conversion', {
        send_to: `${settings.googleAdsId}/${settings.googleAdsCheckoutLabel}`,
        value: getCartValue(cartData),
        currency: getCurrency(cartData),
      })
    }
  }

  await sendServerEvent({
    shop: context.shop,
    settings,
    eventName: 'InitiateCheckout',
    eventId,
    payload,
    userData,
  })

  return eventId
}

export async function trackMarketingAddPaymentInfo(settings = {}, cartData, paymentMethod, context = {}) {
  if (!cartData) return null

  const eventId = createEventId()
  const payload = buildMetaPayload(cartData, { payment_method: paymentMethod })
  const userData = buildUserData(context)

  notifyParent('AddPaymentInfo', { ...payload, event_id: eventId })

  if (!trackedAddPaymentInfo.current) {
    trackedAddPaymentInfo.current = true

    if (settings.metaAdsEnabled && settings.metaPixelEventAddPaymentInfo && settings.metaPixelId && window.fbq) {
      window.fbq('track', 'AddPaymentInfo', payload, { eventID: eventId })
    }

    if (settings.googleAdsEnabled && settings.googlePixelEventAddPaymentInfo && settings.googleAdsId && window.gtag) {
      window.gtag('event', 'add_payment_info', {
        currency: getCurrency(cartData),
        value: getCartValue(cartData),
        payment_type: paymentMethod,
        items: buildGoogleItems(cartData),
      })
    }
  }

  await sendServerEvent({
    shop: context.shop,
    settings,
    eventName: 'AddPaymentInfo',
    eventId,
    payload,
    userData,
  })

  return eventId
}

export async function trackMarketingPurchase(settings = {}, orderSnapshot, context = {}) {
  const cartData = orderSnapshot?.cartData
  if (!cartData) return null

  const eventId = orderSnapshot.marketingEventId || createEventId()
  const value = (orderSnapshot?.orderTotal || cartData.totalPrice || 0) / 100
  const payload = {
    ...buildMetaPayload(cartData, {
      value,
      order_id: orderSnapshot.orderName || orderSnapshot.orderId,
    }),
    transaction_id: orderSnapshot.orderName || String(orderSnapshot.orderId || ''),
  }
  const userData = buildUserData({
    email: context.email || orderSnapshot.email,
    phone: context.phone || orderSnapshot.phone,
  })

  notifyParent('Purchase', { ...payload, event_id: eventId })

  if (settings.metaAdsEnabled && settings.metaPixelEventPurchase && settings.metaPixelId && window.fbq) {
    window.fbq('track', 'Purchase', payload, { eventID: eventId })
  }

  if (settings.googleAdsEnabled && settings.googlePixelEventPurchase && settings.googleAdsId && window.gtag) {
    if (settings.googleAdsPurchaseLabel) {
      window.gtag('event', 'conversion', {
        send_to: `${settings.googleAdsId}/${settings.googleAdsPurchaseLabel}`,
        value,
        currency: getCurrency(cartData),
        transaction_id: payload.transaction_id,
      })
    }

    window.gtag('event', 'purchase', {
      currency: getCurrency(cartData),
      value,
      transaction_id: payload.transaction_id,
      items: buildGoogleItems(cartData),
    })
  }

  return { eventId, payload, userData }
}

export function buildPurchaseMarketingPayload(orderSnapshot, context = {}) {
  const cartData = orderSnapshot?.cartData
  if (!cartData) return null

  const eventId = createEventId()
  const value = (orderSnapshot?.orderTotal || cartData.totalPrice || 0) / 100

  return {
    eventId,
    payload: {
      ...buildMetaPayload(cartData, {
        value,
        order_id: orderSnapshot.orderName || orderSnapshot.orderId || eventId,
      }),
      transaction_id: orderSnapshot.orderName || String(orderSnapshot.orderId || eventId),
    },
    userData: buildUserData({
      email: context.email || orderSnapshot.email,
      phone: context.phone || orderSnapshot.phone,
    }),
  }
}
