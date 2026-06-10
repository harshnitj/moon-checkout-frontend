import React from 'react'
import { DEFAULT_CHECKOUT_SETTINGS } from '../utils/payment'
import { getFieldStatus } from '../utils/formValidation'
import ValidatedField from './ValidatedField'

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
  const phoneMaxLength = settings.phoneLength || 10
  const formValues = { email, phone, delivery: {} }
  const emailStatus = getFieldStatus('email', formValues, settings, emailError)
  const phoneStatus = getFieldStatus('phone', formValues, settings, phoneError)

  return (
    <div className="checkout-section">
      <h2 className="checkout-section__title">Contact</h2>

      {showEmail && (
        <div className="checkout-input-row">
          <ValidatedField status={emailStatus}>
            <input
              type="email"
              placeholder={settings.emailRequired !== false ? 'Email address*' : 'Email address (optional)'}
              value={email}
              onChange={(e) => onEmailChange(e.target.value.trim())}
              maxLength={120}
              className="checkout-input"
            />
          </ValidatedField>
          {emailError && <p className="checkout-error">{emailError}</p>}
        </div>
      )}

      <div className="checkout-input-row checkout-phone-row">
        <span className="checkout-phone-prefix">+91</span>
        <ValidatedField status={phoneStatus} className="checkout-input-wrap--flex">
          <input
            type="tel"
            placeholder={`Enter ${phoneMaxLength}-digit mobile no.*`}
            value={phone}
            maxLength={phoneMaxLength}
            onChange={(e) => onPhoneChange(e.target.value.replace(/\D/g, ''))}
            className="checkout-input checkout-input--phone"
          />
        </ValidatedField>
      </div>
      {phoneError && <p className="checkout-error">{phoneError}</p>}
    </div>
  )
}
