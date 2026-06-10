import React from 'react'

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

function FallbackBrandLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="14" cy="14" r="14" fill="#f1f5f9" />
      <rect x="7.5" y="9" width="2" height="10" rx="1" fill="#2563eb" />
      <rect x="10.5" y="7" width="2" height="14" rx="1" fill="#7c3aed" />
      <rect x="13.5" y="10" width="2" height="8" rx="1" fill="#059669" />
      <rect x="16.5" y="8" width="2" height="12" rx="1" fill="#d97706" />
      <rect x="19.5" y="11" width="2" height="6" rx="1" fill="#dc2626" />
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
          {shopLogoUrl ? (
            <img
              src={shopLogoUrl}
              alt=""
              className="checkout-header__logo-img"
            />
          ) : (
            <FallbackBrandLogo />
          )}
          <span className="checkout-header__title">{displayName}</span>
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
