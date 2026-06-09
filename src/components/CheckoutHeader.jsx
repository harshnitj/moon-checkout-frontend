import React from 'react'

export default function CheckoutHeader() {
  return (
    <div className="checkout-header">
      <span className="checkout-header__title">Checkout</span>
      <button
        type="button"
        aria-label="Close checkout"
        onClick={() => window.parent.postMessage({ type: 'MOON_CHECKOUT_CLOSE' }, '*')}
        className="checkout-header__close"
      >
        ✕
      </button>
    </div>
  )
}
