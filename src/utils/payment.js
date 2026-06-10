import { getCodChargeForCart } from './codCharges'
import { DEFAULT_THEME_COLORS } from './theme'
import { filterPaymentMethodsByRto } from './rtoRules'

const DEFAULT_MARKETING_SETTINGS = {
  metaAdsEnabled: false,
  metaPixelId: '',
  metaCapiEnabled: false,
  metaCapiConfigured: false,
  metaPixelEventInitiateCheckout: true,
  metaPixelEventAddPaymentInfo: true,
  metaPixelEventPurchase: true,
  metaCapiEventInitiateCheckout: true,
  metaCapiEventAddPaymentInfo: true,
  metaCapiEventPurchase: true,
  googleAdsEnabled: false,
  googleAdsId: '',
  googleAdsPurchaseLabel: '',
  googleAdsCheckoutLabel: '',
  googleCapiEnabled: false,
  googleCapiConfigured: false,
  googleMeasurementId: '',
  googlePixelEventInitiateCheckout: true,
  googlePixelEventAddPaymentInfo: true,
  googlePixelEventPurchase: true,
  googleCapiEventInitiateCheckout: true,
  googleCapiEventAddPaymentInfo: true,
  googleCapiEventPurchase: true,
}

export const CHECKOUT_VARIANTS = {
  SINGLE_PAGE: 'single-page',
  THREE_STEP: 'three-step',
}

export const DEFAULT_CHECKOUT_SETTINGS = {
  checkoutEnabled: true,
  checkoutVariant: CHECKOUT_VARIANTS.SINGLE_PAGE,
  codEnabled: true,
  onlineEnabled: true,
  advanceEnabled: true,
  codMinCartPaise: 0,
  codMaxCartPaise: null,
  onlineDiscountPercent: 10,
  onlineDiscountMaxPaise: 15000,
  advanceDiscountPercent: 5,
  advanceDiscountMaxPaise: 10000,
  advanceAmountPaise: 9900,
  codLabel: 'Pay COD (Cash on Delivery)',
  onlineLabel: 'Pay Online',
  advanceLabel: 'Partial COD',
  onlineBadge: '10% off up to ₹150',
  advanceBadge: '5% off up to ₹100',
  emailEnabled: true,
  emailRequired: true,
  nameMinLength: 2,
  nameMaxLength: 50,
  phoneLength: 10,
  phoneStartDigits: '6789',
  houseNumberEnabled: true,
  houseNumberRequired: true,
  houseNumberLabel: 'House / Flat No.',
  houseNumberMaxLength: 30,
  streetEnabled: true,
  streetRequired: true,
  streetLabel: 'Street / Area',
  streetMaxLength: 120,
  landmarkEnabled: true,
  landmarkRequired: false,
  landmarkLabel: 'Nearest Landmark',
  landmarkMaxLength: 100,
  codChargeEnabled: false,
  codChargeRules: [],
  rtoEngineEnabled: false,
  rtoDefaultBlockMessage: 'This payment method is not available for your order.',
  razorpayKeyId: null,
  razorpayConfigured: false,
  ...DEFAULT_THEME_COLORS,
  ...DEFAULT_MARKETING_SETTINGS,
}

function roundRupee(paise) {
  return Math.round(paise / 100) * 100
}

export function formatPrice(paise) {
  const rupees = Math.round(paise / 100)
  return '₹' + rupees.toLocaleString('en-IN', { maximumFractionDigits: 0, minimumFractionDigits: 0 })
}

function hasItemCompareAtPrice(item) {
  return item.compareAtPrice != null && item.compareAtPrice > 0 && item.compareAtPrice > item.price
}

function getMrpPricing(cartData) {
  const sellingTotal = cartData.totalPrice
  const items = cartData.items || []
  const hasCompareAtPrice = items.some(hasItemCompareAtPrice)

  if (!hasCompareAtPrice) {
    return { itemTotal: sellingTotal, saleDiscount: 0 }
  }

  const mrpTotal = items.reduce((sum, item) => {
    const unitMrp = hasItemCompareAtPrice(item) ? item.compareAtPrice : item.price
    return sum + unitMrp * item.quantity
  }, 0)

  return {
    itemTotal: mrpTotal,
    saleDiscount: roundRupee(Math.max(mrpTotal - sellingTotal, 0)),
  }
}

export function getPaymentBreakdown(cartData, paymentMethod, settings = DEFAULT_CHECKOUT_SETTINGS) {
  const config = { ...DEFAULT_CHECKOUT_SETTINGS, ...settings }
  const advanceAmount = config.advanceAmountPaise

  if (!cartData) {
    return {
      itemTotal: 0,
      saleDiscount: 0,
      onlineDiscount: 0,
      advanceDiscount: 0,
      deliveryFee: 0,
      codCharge: 0,
      finalTotal: 0,
      totalSaving: 0,
      advancePayNow: advanceAmount,
      advanceCodBalance: 0,
      cartSubtotal: 0,
    }
  }

  const subtotal = cartData.totalPrice
  const { itemTotal, saleDiscount } = getMrpPricing(cartData)

  const onlineDiscount = paymentMethod === 'online'
    ? Math.min(
        roundRupee(subtotal * (config.onlineDiscountPercent / 100)),
        config.onlineDiscountMaxPaise
      )
    : 0

  const advanceDiscount = paymentMethod === 'advance'
    ? Math.min(
        roundRupee(subtotal * (config.advanceDiscountPercent / 100)),
        config.advanceDiscountMaxPaise
      )
    : 0

  const deliveryFee = 0
  const codCharge = paymentMethod === 'cod' || paymentMethod === 'advance'
    ? getCodChargeForCart(subtotal, config)
    : 0
  const finalTotal = subtotal - onlineDiscount - advanceDiscount + deliveryFee + codCharge
  const totalSaving = saleDiscount + onlineDiscount + advanceDiscount
  const advancePayNow = advanceAmount
  const advanceCodBalance = Math.max(finalTotal - advanceAmount, 0)

  return {
    itemTotal,
    saleDiscount,
    onlineDiscount,
    advanceDiscount,
    deliveryFee,
    codCharge,
    finalTotal,
    totalSaving,
    advancePayNow,
    advanceCodBalance,
    cartSubtotal: subtotal,
  }
}

export function getAvailablePaymentMethods(cartData, settings = DEFAULT_CHECKOUT_SETTINGS, rtoContext = null) {
  const config = { ...DEFAULT_CHECKOUT_SETTINGS, ...settings }
  const subtotal = cartData?.totalPrice || 0
  const methods = []

  const razorpayReady = config.razorpayConfigured

  if (config.onlineEnabled && razorpayReady) methods.push('online')
  if (config.advanceEnabled && razorpayReady) methods.push('advance')

  const codAllowed = config.codEnabled
    && subtotal >= config.codMinCartPaise
    && (config.codMaxCartPaise == null || subtotal <= config.codMaxCartPaise)

  if (codAllowed) methods.push('cod')

  if (!rtoContext || !config.rtoEngineEnabled) return methods
  return filterPaymentMethodsByRto(methods, config, rtoContext)
}
