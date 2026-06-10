import React from 'react'
import { DEFAULT_CHECKOUT_SETTINGS, formatPrice, getPaymentBreakdown } from '../utils/payment'

export default function BillDetails({ cartData, paymentMethod, settings = DEFAULT_CHECKOUT_SETTINGS }) {
  if (!cartData) return null

  const config = { ...DEFAULT_CHECKOUT_SETTINGS, ...settings }
  const {
    itemTotal,
    saleDiscount,
    onlineDiscount,
    advanceDiscount,
    deliveryFee,
    codCharge,
    finalTotal,
    totalSaving,
  } = getPaymentBreakdown(cartData, paymentMethod, config)

  return (
    <div className="checkout-section checkout-section--bill">
      <h2 className="checkout-section__title">Bill Details</h2>

      <div className="bill-row">
        <span className="bill-row__label">Items</span>
        <span className="bill-row__value">{cartData.itemCount}</span>
      </div>
      <div className="bill-row">
        <span className="bill-row__label">Item total</span>
        <span className="bill-row__value">{formatPrice(itemTotal)}</span>
      </div>
      {saleDiscount > 0 && (
        <div className="bill-row">
          <span className="bill-row__label">Sale Discount</span>
          <span className="bill-row__value bill-row__value--green">-{formatPrice(saleDiscount)}</span>
        </div>
      )}
      {onlineDiscount > 0 && (
        <div className="bill-row">
          <span className="bill-row__label">Online Discount ({config.onlineDiscountPercent}%)</span>
          <span className="bill-row__value bill-row__value--green">-{formatPrice(onlineDiscount)}</span>
        </div>
      )}
      {advanceDiscount > 0 && (
        <div className="bill-row">
          <span className="bill-row__label">Partial COD Discount ({config.advanceDiscountPercent}%)</span>
          <span className="bill-row__value bill-row__value--green">-{formatPrice(advanceDiscount)}</span>
        </div>
      )}
      <div className="bill-row">
        <span className="bill-row__label">Delivery fee</span>
        <span className="bill-row__value bill-row__value--green">₹0</span>
      </div>
      {codCharge > 0 && (
        <div className="bill-row">
          <span className="bill-row__label">COD charge</span>
          <span className="bill-row__value">+{formatPrice(codCharge)}</span>
        </div>
      )}

      <div className="bill-divider" />

      <div className="bill-row bill-row--total">
        <span>Total amount</span>
        <span>{formatPrice(finalTotal)}</span>
      </div>

      {totalSaving > 0 && (
        <div className="savings-banner">
          <img
            src="/payment-icons/percentage.svg"
            alt=""
            className="savings-banner__icon"
            aria-hidden="true"
          />
          <span>Yay! your total discount is {formatPrice(totalSaving)}</span>
        </div>
      )}
    </div>
  )
}
