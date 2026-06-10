import React, { useState } from 'react'
import CheckoutHeader from './CheckoutHeader'
import { formatPrice } from '../utils/payment'

function getEstimatedDeliveryDate() {
  const date = new Date()
  date.setDate(date.getDate() + 5)
  return date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })
}

function getPaymentLabel(paymentMethod) {
  if (paymentMethod === 'cod') return 'Cash on Delivery'
  if (paymentMethod === 'advance') return 'Partial COD'
  return 'Online Payment'
}

function maskPhone(phone) {
  if (!phone || phone.length < 4) return phone
  return `• • • ${phone.slice(-4)}`
}

function isRealEmail(email) {
  return email && !email.endsWith('@moon-checkout.local')
}

export default function OrderSuccessPage({ order, shopName, shopLogoUrl }) {
  const [copied, setCopied] = useState(false)
  const items = order.cartData?.items || []
  const primaryItem = items[0]
  const extraItems = items.length - 1
  const showEmailBanner = isRealEmail(order.email)

  function handleContinue() {
    window.parent.postMessage({ type: 'MOON_CHECKOUT_CLOSE' }, '*')
  }

  function handleTrack() {
    window.parent.postMessage(
      {
        type: 'MOON_CHECKOUT_TRACK_ORDER',
        orderId: order.orderId,
        orderName: order.orderName,
      },
      '*'
    )
  }

  async function handleInvoice() {
    try {
      await navigator.clipboard.writeText(order.orderName)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="checkout-page checkout-page--success">
      <CheckoutHeader shopName={shopName} shopLogoUrl={shopLogoUrl} />

      <div className="order-success">
        <div className="order-success__hero">
          <div className="order-success__icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 6L9 17l-5-5"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="order-success__title">Order Placed!</h1>
          <p className="order-success__order-no">Order {order.orderName}</p>
        </div>

        {showEmailBanner && (
          <div className="order-success__email-banner">
            <span className="order-success__email-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 6h16v12H4V6zm0 0 8 7 8-7"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span>Confirmation sent to {order.email}</span>
          </div>
        )}

        <div className="order-success__card">
          {primaryItem && (
            <div className="order-success__product">
              <div className="order-success__product-image-wrap">
                {primaryItem.image ? (
                  <img src={primaryItem.image} alt="" className="order-success__product-image" />
                ) : (
                  <div className="order-success__product-image order-success__product-image--placeholder" />
                )}
              </div>
              <div className="order-success__product-info">
                <p className="order-success__product-title">{primaryItem.title}</p>
                <p className="order-success__product-meta">
                  {[
                    primaryItem.variantTitle && primaryItem.variantTitle !== 'Default Title'
                      ? `Size: ${primaryItem.variantTitle}`
                      : null,
                    `Qty: ${primaryItem.quantity}`,
                  ]
                    .filter(Boolean)
                    .join(' • ')}
                  {extraItems > 0 ? ` • +${extraItems} more` : ''}
                </p>
              </div>
            </div>
          )}

          <div className="order-success__details">
            <div className="order-success__detail">
              <span className="order-success__detail-label">Delivery to</span>
              <span className="order-success__detail-value">
                {[order.delivery?.city, order.delivery?.pincode].filter(Boolean).join(', ') || '—'}
              </span>
            </div>
            <div className="order-success__detail">
              <span className="order-success__detail-label">Estimated date</span>
              <span className="order-success__detail-value order-success__detail-value--accent">
                {getEstimatedDeliveryDate()}
              </span>
            </div>
          </div>

          <div className="order-success__details order-success__details--payment">
            <div className="order-success__detail">
              <span className="order-success__detail-label">Payment method</span>
              <span className="order-success__detail-value order-success__payment">
                {order.paymentMethod !== 'cod' && (
                  <img src="/payment-icons/upi.svg" alt="" className="order-success__payment-icon" />
                )}
                {getPaymentLabel(order.paymentMethod)}
                {order.paymentMethod !== 'cod' && order.phone ? ` • ${maskPhone(order.phone)}` : ''}
              </span>
            </div>
            <div className="order-success__detail order-success__detail--right">
              <span className="order-success__detail-label">Total paid</span>
              <span className="order-success__detail-value order-success__detail-value--total">
                {order.paymentMethod === 'cod' ? formatPrice(order.orderTotal) : formatPrice(order.totalPaid)}
              </span>
              {order.paymentMethod === 'cod' && (
                <span className="order-success__cod-note">Pay on delivery</span>
              )}
            </div>
          </div>
        </div>

        <div className="order-success__actions">
          <button type="button" className="order-success__secondary-btn" onClick={handleInvoice}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M8 4h8v16H8V4zm-2 0h12v16H6V4z" stroke="currentColor" strokeWidth="1.6" />
              <path d="M9 8h6M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            {copied ? 'Copied!' : 'Invoice'}
          </button>
          <button type="button" className="order-success__secondary-btn" onClick={handleTrack}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M3 7h11v8H3V7zm11 2h4l3 3v3h-7V9z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <circle cx="7" cy="17" r="2" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="17" cy="17" r="2" stroke="currentColor" strokeWidth="1.6" />
            </svg>
            Track
          </button>
        </div>

        <button type="button" className="order-success__cta" onClick={handleContinue}>
          Continue Shopping
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M5 12h14M13 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <p className="order-success__powered">🌙 POWERED BY MOON CHECKOUT</p>
      </div>
    </div>
  )
}
