import { trackFunnelEvent } from '../services/funnel'
import { isFieldValid } from './formValidation'

const SESSION_KEY = 'moon_checkout_session'

export function getFunnelSessionId() {
  try {
    let sessionId = sessionStorage.getItem(SESSION_KEY)
    if (!sessionId) {
      sessionId = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `session-${Date.now()}-${Math.random().toString(36).slice(2)}`
      sessionStorage.setItem(SESSION_KEY, sessionId)
    }
    return sessionId
  } catch {
    return `session-${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
}

function buildCartSnapshot(cartData) {
  if (!cartData) return null
  return {
    itemCount: cartData.itemCount,
    totalPrice: cartData.totalPrice,
    currency: cartData.currency || 'INR',
    items: (cartData.items || []).map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      title: item.title,
      variantTitle: item.variantTitle,
      quantity: item.quantity,
      price: item.price,
      sku: item.sku,
      image: item.image,
    })),
  }
}

function buildCustomer(formValues = {}) {
  const { email, phone, delivery } = formValues
  return {
    phone: phone || null,
    email: email?.trim() || null,
    name: delivery?.name?.trim() || null,
  }
}

export function buildFunnelPayload({
  shop,
  event,
  checkoutVariant,
  lastStep,
  cartData,
  formValues,
  paymentMethod,
}) {
  return {
    shop,
    sessionId: getFunnelSessionId(),
    event,
    checkoutVariant,
    lastStep,
    cartSnapshot: buildCartSnapshot(cartData),
    customer: buildCustomer(formValues),
    delivery: formValues?.delivery || null,
    paymentMethod: paymentMethod || null,
  }
}

export async function sendFunnelEvent(options) {
  if (!options?.shop || !options?.event) return null
  return trackFunnelEvent(buildFunnelPayload(options))
}

export function isPhoneCaptured(formValues, settings) {
  return isFieldValid('phone', formValues, settings)
}

export function isAddressCaptured(formValues, settings) {
  return isFieldValid('pincode', formValues, settings)
}

export function isContactStepComplete(formValues, settings) {
  const emailOk = settings.emailEnabled === false
    || !settings.emailRequired
    || isFieldValid('email', formValues, settings)
  return isPhoneCaptured(formValues, settings) && emailOk
}
