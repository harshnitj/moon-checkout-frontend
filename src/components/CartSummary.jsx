import React, { useState, useEffect } from 'react'

function formatPrice(paise) {
  return '₹' + (paise / 100).toLocaleString('en-IN')
}

export default function CartSummary({ cartData }) {
  const [expanded, setExpanded] = useState(() => cartData?.itemCount === 1)

  useEffect(() => {
    if (!cartData) return
    setExpanded(cartData.itemCount === 1)
  }, [cartData?.itemCount])

  if (!cartData) return null

  return (
    <div className="checkout-section--flat" style={{ padding: 0 }}>
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="cart-summary__toggle"
      >
        <span>{cartData.itemCount} Item</span>
        <span className={`cart-summary__chevron ${expanded ? 'cart-summary__chevron--open' : ''}`}>
          ▼
        </span>
      </button>

      {expanded && cartData.items.map((item, i) => (
        <div key={i} className="cart-item">
          <div className="cart-item__image-wrap">
            {item.image ? (
              <img src={item.image} alt={item.title} className="cart-item__image" />
            ) : (
              <div className="cart-item__image" style={{ background: '#e8e8e8' }} />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="cart-item__title">{item.title}</div>
            <div className="cart-item__meta">
              {[
                item.variantTitle && item.variantTitle !== 'Default Title'
                  ? `Size: ${item.variantTitle}`
                  : null,
                `Qty: ${item.quantity}`,
              ]
                .filter(Boolean)
                .join('/')}
            </div>
            <div className="cart-item__price">
              {formatPrice(item.price * item.quantity)}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
