import React from 'react'
import { DEFAULT_CHECKOUT_SETTINGS, formatPrice, getAvailablePaymentMethods, getPaymentBreakdown } from '../utils/payment'
import { getCodChargeForCart } from '../utils/codCharges'
import { getRtoNotice } from '../utils/rtoRules'

const PAYMENT_ICONS = [
  { name: 'PhonePe', src: '/payment-icons/phonepe.svg' },
  { name: 'Google Pay', src: '/payment-icons/gpay.svg' },
  { name: 'Paytm', src: '/payment-icons/paytm.svg' },
  { name: 'UPI', src: '/payment-icons/upi.svg' },
  { name: 'RuPay', src: '/payment-icons/rupay.svg' },
  { name: 'Mastercard', src: '/payment-icons/mastercard.svg' },
  { name: 'VISA', src: '/payment-icons/visa.svg' },
]

export default function PaymentMethod({
  selected,
  onChange,
  cartData,
  settings = DEFAULT_CHECKOUT_SETTINGS,
  rtoContext = null,
}) {
  const config = { ...DEFAULT_CHECKOUT_SETTINGS, ...settings }
  const { advanceCodBalance, advancePayNow } = getPaymentBreakdown(cartData, 'advance', config)
  const subtotal = cartData?.totalPrice || 0
  const availableMethods = getAvailablePaymentMethods(cartData, config, rtoContext)
  const codAllowed = availableMethods.includes('cod')
  const onlineAllowed = availableMethods.includes('online')
  const advanceAllowed = availableMethods.includes('advance')
  const codCharge = getCodChargeForCart(subtotal, config)
  const partialCodCharge = codCharge
  const rtoNotice = getRtoNotice(config, rtoContext)

  return (
    <div className="checkout-section checkout-section--payment">
      <div className="payment-header">
        <h2 className="checkout-section__title checkout-section__title--payment">Payment Method</h2>
        <img
          src="/payment-icons/hundred-percent-safe.svg"
          alt="100% Safe Payments"
          className="payment-safe-badge"
        />
      </div>

      {rtoNotice && (
        <div className="payment-rto-notice">{rtoNotice}</div>
      )}

      {onlineAllowed && (
        <label className="payment-option">
          <input
            type="radio"
            name="payment"
            value="online"
            checked={selected === 'online'}
            onChange={() => onChange('online')}
            className="payment-option__radio"
          />
          <div className="payment-option__content">
            <div className="payment-option__row">
              <span className="payment-option__label">{config.onlineLabel}</span>
              {config.onlineBadge && <span className="payment-badge">{config.onlineBadge}</span>}
            </div>
            <div className="payment-icons">
              {PAYMENT_ICONS.map(({ name, src }) => (
                <img key={name} src={src} alt={name} title={name} />
              ))}
            </div>
          </div>
        </label>
      )}

      {advanceAllowed && (
        <label className="payment-option">
          <input
            type="radio"
            name="payment"
            value="advance"
            checked={selected === 'advance'}
            onChange={() => onChange('advance')}
            className="payment-option__radio"
          />
          <div className="payment-option__content">
            <div className="payment-option__row">
              <div className="payment-option__label-wrap">
                <span className="payment-option__label">{config.advanceLabel}</span>
                <span className="payment-new-badge">New</span>
              </div>
              {config.advanceBadge && <span className="payment-discount-text">{config.advanceBadge}</span>}
            </div>
            <p className="payment-option__subtext">
              Partial COD: pay {formatPrice(advancePayNow)} online now, remaining {formatPrice(advanceCodBalance)} in cash on delivery
              {partialCodCharge > 0 ? ` (includes ${formatPrice(partialCodCharge)} COD charge)` : ''}
            </p>
          </div>
        </label>
      )}

      {codAllowed && (
        <label className="payment-option payment-option--last">
          <input
            type="radio"
            name="payment"
            value="cod"
            checked={selected === 'cod'}
            onChange={() => onChange('cod')}
            className="payment-option__radio"
          />
          <div className="payment-option__content">
            <span className="payment-option__label">{config.codLabel}</span>
            {codCharge > 0 && (
              <p className="payment-option__subtext">+{formatPrice(codCharge)} COD charge applies</p>
            )}
          </div>
        </label>
      )}

      <div className="offers-banner">
        <div className="offers-banner__left">
          <img
            src="/payment-icons/offers-tag.svg"
            alt=""
            className="offers-banner__icon"
            aria-hidden="true"
          />
          <div className="offers-banner__text">
            <span className="offers-banner__title">Save Upto ₹250</span>
            <span className="offers-banner__subtitle">3 Offers Available</span>
          </div>
        </div>
        <button type="button" className="offers-banner__link">OFFERS</button>
      </div>
    </div>
  )
}
