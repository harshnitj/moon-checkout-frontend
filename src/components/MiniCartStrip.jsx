import React from 'react'
import { formatPrice } from '../utils/payment'

export default function MiniCartStrip({ cartData }) {
  if (!cartData?.items?.length) return null
  const item = cartData.items[0]
  const extra = cartData.items.length - 1

  return (
    <div className="mini-cart-strip">
      <div className="mini-cart-strip__image-wrap">
        {item.image ? (
          <img src={item.image} alt="" className="mini-cart-strip__image" />
        ) : (
          <div className="mini-cart-strip__image mini-cart-strip__image--placeholder" />
        )}
      </div>
      <div className="mini-cart-strip__info">
        <p className="mini-cart-strip__title">
          {item.title}
          {extra > 0 ? ` +${extra} more` : ''}
        </p>
        <p className="mini-cart-strip__meta">
          {[
            item.variantTitle && item.variantTitle !== 'Default Title'
              ? `Size: ${item.variantTitle}`
              : null,
            `Qty: ${item.quantity}`,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>
      <div className="mini-cart-strip__price">{formatPrice(cartData.totalPrice)}</div>
    </div>
  )
}
