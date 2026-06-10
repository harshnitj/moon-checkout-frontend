import React from 'react'
import { DEFAULT_CHECKOUT_SETTINGS, formatPrice, getPaymentBreakdown } from '../utils/payment'

export default function PaymentOrderSummary({ cartData, paymentMethod, settings = DEFAULT_CHECKOUT_SETTINGS }) {
  if (!cartData) return null

  const {
    itemTotal,
    saleDiscount,
    onlineDiscount,
    advanceDiscount,
    codCharge,
    finalTotal,
  } = getPaymentBreakdown(cartData, paymentMethod, settings)

  const itemLabel = `Bag Total (${cartData.itemCount} item${cartData.itemCount === 1 ? '' : 's'})`

  return (
    <div className="payment-order-summary">
      <h3 className="payment-order-summary__title">Order Summary</h3>
      <div className="payment-order-summary__row">
        <span>{itemLabel}</span>
        <span>{formatPrice(itemTotal)}</span>
      </div>
      {saleDiscount > 0 && (
        <div className="payment-order-summary__row">
          <span>Sale Discount</span>
          <span className="payment-order-summary__discount">-{formatPrice(saleDiscount)}</span>
        </div>
      )}
      <div className="payment-order-summary__row">
        <span>Shipping</span>
        <span className="payment-order-summary__discount">FREE</span>
      </div>
      {onlineDiscount > 0 && (
        <div className="payment-order-summary__row">
          <span>Prepaid Discount</span>
          <span className="payment-order-summary__discount">-{formatPrice(onlineDiscount)}</span>
        </div>
      )}
      {advanceDiscount > 0 && (
        <div className="payment-order-summary__row">
          <span>Partial COD Discount</span>
          <span className="payment-order-summary__discount">-{formatPrice(advanceDiscount)}</span>
        </div>
      )}
      {codCharge > 0 && (
        <div className="payment-order-summary__row">
          <span>COD charge</span>
          <span>+{formatPrice(codCharge)}</span>
        </div>
      )}
      <div className="payment-order-summary__row payment-order-summary__row--total">
        <span>Total Amount</span>
        <span>{formatPrice(finalTotal)}</span>
      </div>
    </div>
  )
}
