import React from 'react'
import { formatPrice } from '../utils/payment'

export default function OrderSummaryPanel({ cartData, subtotal }) {
  if (!cartData) return null

  return (
    <div className="checkout-section checkout-section--order-summary">
      <h2 className="checkout-section__title">Order Summary</h2>

      <div className="order-summary__items">
        {cartData.items.map((item, i) => (
          <div key={i} className="cart-item cart-item--expanded">
            <div className="cart-item__image-wrap">
              {item.image ? (
                <img src={item.image} alt="" className="cart-item__image" />
              ) : (
                <div className="cart-item__image cart-item__image--placeholder" />
              )}
            </div>
            <div className="cart-item__body">
              <div className="cart-item__title">{item.title}</div>
              <div className="cart-item__meta">
                {[
                  item.variantTitle && item.variantTitle !== 'Default Title'
                    ? `Size: ${item.variantTitle}`
                    : null,
                  `Qty: ${item.quantity}`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
              <div className="cart-item__price">{formatPrice(item.price * item.quantity)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="order-summary__totals">
        <div className="order-summary__row">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="order-summary__row">
          <span>Shipping</span>
          <span className="order-summary__free">FREE</span>
        </div>
        <div className="order-summary__row order-summary__row--total">
          <span>Total</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
      </div>
    </div>
  )
}
