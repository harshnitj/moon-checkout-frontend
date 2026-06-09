import React from 'react'

function formatPrice(paise) {
  return '₹' + (paise / 100).toLocaleString('en-IN')
}

export default function StickyFooter({ total, onPlaceOrder, loading, paymentMethod, advancePayNow = 9900 }) {
  return (
    <div className="checkout-footer">
      <div>
        <div className="checkout-footer__label">Total Amount</div>
        <div className="checkout-footer__total">{formatPrice(total)}</div>
      </div>
      <button
        type="button"
        onClick={onPlaceOrder}
        disabled={loading}
        className="checkout-footer__btn"
      >
        {loading
          ? 'Placing...'
          : paymentMethod === 'cod'
          ? 'Place Order'
          : paymentMethod === 'advance'
          ? `Pay ${formatPrice(advancePayNow)} (Partial COD)`
          : 'Pay & Order'}
      </button>
    </div>
  )
}
