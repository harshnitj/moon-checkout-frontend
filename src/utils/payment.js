import { getCodChargeForCart } from './codCharges'

export const DEFAULT_CHECKOUT_SETTINGS = {
  checkoutEnabled: true,
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
}

export function formatPrice(paise) {
  return '₹' + (paise / 100).toLocaleString('en-IN')
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

  const itemTotal = cartData.originalTotalPrice
  const saleDiscount = cartData.originalTotalPrice - cartData.totalPrice
  const subtotal = cartData.totalPrice

  const onlineDiscount = paymentMethod === 'online'
    ? Math.min(
        Math.round(subtotal * (config.onlineDiscountPercent / 100)),
        config.onlineDiscountMaxPaise
      )
    : 0

  const advanceDiscount = paymentMethod === 'advance'
    ? Math.min(
        Math.round(subtotal * (config.advanceDiscountPercent / 100)),
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

export function getAvailablePaymentMethods(cartData, settings = DEFAULT_CHECKOUT_SETTINGS) {
  const config = { ...DEFAULT_CHECKOUT_SETTINGS, ...settings }
  const subtotal = cartData?.totalPrice || 0
  const methods = []

  if (config.onlineEnabled) methods.push('online')
  if (config.advanceEnabled) methods.push('advance')

  const codAllowed = config.codEnabled
    && subtotal >= config.codMinCartPaise
    && (config.codMaxCartPaise == null || subtotal <= config.codMaxCartPaise)

  if (codAllowed) methods.push('cod')
  return methods
}
