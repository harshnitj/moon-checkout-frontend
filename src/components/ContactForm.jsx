import React from 'react'
import { DEFAULT_CHECKOUT_SETTINGS } from '../utils/payment'

export default function ContactForm({
  phone,
  email,
  onPhoneChange,
  onEmailChange,
  phoneError,
  emailError,
  settings = DEFAULT_CHECKOUT_SETTINGS,
}) {
  const showEmail = settings.emailEnabled !== false
  const emailRequired = settings.emailRequired !== false
  const phoneMaxLength = settings.phoneLength || 10

  return (
    <div className="checkout-section">
      <h2 className="checkout-section__title">Contact</h2>

      {showEmail && (
        <div className="checkout-input-row">
          <input
            type="email"
            placeholder={emailRequired ? 'Email address*' : 'Email address (optional)'}
            value={email}
            onChange={(e) => onEmailChange(e.target.value.trim())}
            maxLength={120}
            className={`checkout-input ${emailError ? 'checkout-input--error' : ''}`}
          />
          {emailError && <p className="checkout-error">{emailError}</p>}
        </div>
      )}

      <div className="checkout-input-row checkout-phone-row">
        <span className="checkout-phone-prefix">+91</span>
        <input
          type="tel"
          placeholder={`Enter ${phoneMaxLength}-digit mobile no.*`}
          value={phone}
          maxLength={phoneMaxLength}
          onChange={(e) => onPhoneChange(e.target.value.replace(/\D/g, ''))}
          className={`checkout-input checkout-input--phone ${phoneError ? 'checkout-input--error' : ''}`}
        />
      </div>
      {phoneError && <p className="checkout-error">{phoneError}</p>}
    </div>
  )
}
