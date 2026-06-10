import React from 'react'
import { formatPrice } from '../utils/payment'

export default function StepFooter({
  step,
  total,
  onPlaceOrder,
  loading,
  loadingMessage = '',
  paymentMethod,
  advancePayNow = 9900,
  onContinue,
}) {
  if (step < 3) {
    return (
      <div className="checkout-footer checkout-footer--steps checkout-footer--steps-only">
        <button
          type="button"
          className="checkout-footer__btn checkout-footer__btn--continue"
          onClick={onContinue}
          disabled={loading}
        >
          Continue
        </button>
      </div>
    )
  }

  const label = loading
    ? (loadingMessage.includes('Preparing') ? 'Opening...' : 'Processing...')
    : paymentMethod === 'cod'
    ? 'Place Order'
    : paymentMethod === 'advance'
    ? `Pay ${formatPrice(advancePayNow)} (Partial COD)`
    : 'Pay & Order'

  return (
    <div className="checkout-footer checkout-footer--steps-only">
      <div className="checkout-footer__summary">
        <div className="checkout-footer__label">Total Amount</div>
        <div className="checkout-footer__total">{formatPrice(total)}</div>
      </div>
      <button
        type="button"
        onClick={onPlaceOrder}
        disabled={loading}
        className="checkout-footer__btn"
      >
        {loading && <span className="loader__spinner loader__spinner--sm" aria-hidden="true" />}
        {label}
      </button>
    </div>
  )
}
