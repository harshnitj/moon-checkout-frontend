import React from 'react'
import { MOON_LOGO_SRC } from '../constants/brand'

function BackArrowIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function CheckoutHeader({
  showBackArrow = false,
  onBackClick,
  showClose = false,
  shopName,
  shopLogoUrl,
}) {
  const displayName = shopName || 'Checkout'

  return (
    <div className="checkout-header">
      <div className="checkout-header__left">
        {showBackArrow ? (
          <button
            type="button"
            aria-label="Go back"
            onClick={onBackClick}
            className="checkout-header__back"
          >
            <BackArrowIcon />
          </button>
        ) : null}

        <div className="checkout-header__brand">
          <img
            src={shopLogoUrl || MOON_LOGO_SRC}
            alt={displayName}
            className={`checkout-header__logo-img${shopLogoUrl ? '' : ' checkout-header__logo-img--moon'}`}
          />
        </div>
      </div>

      {showClose ? (
        <button
          type="button"
          aria-label="Close checkout"
          onClick={() => window.parent.postMessage({ type: 'MOON_CHECKOUT_CLOSE' }, '*')}
          className="checkout-header__close"
        >
          ✕
        </button>
      ) : null}
    </div>
  )
}
