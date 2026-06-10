import React from 'react'

export default function CouponsSection() {
  return (
    <div className="checkout-section checkout-section--coupons">
      <h2 className="checkout-section__title">Coupons</h2>
      <div className="coupon-field">
        <input
          type="text"
          className="checkout-input coupon-field__input"
          placeholder="Enter coupon code"
          disabled
          aria-describedby="coupon-coming-soon"
        />
        <button type="button" className="coupon-field__btn" disabled>
          Apply
        </button>
      </div>
      <p id="coupon-coming-soon" className="coupon-field__hint">
        Coupon codes will be available in a future update.
      </p>
    </div>
  )
}
