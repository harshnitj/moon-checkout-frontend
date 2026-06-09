import React, { useState, useEffect, useRef } from 'react'
import { lookupPincode } from '../services/pincode'
import { DEFAULT_CHECKOUT_SETTINGS } from '../utils/payment'

export default function DeliveryForm({ delivery, onChange, errors, settings = DEFAULT_CHECKOUT_SETTINGS }) {
  const [pincodeLoading, setPincodeLoading] = useState(false)
  const debounceRef = useRef(null)
  const config = { ...DEFAULT_CHECKOUT_SETTINGS, ...settings }
  const showLocationFields = delivery.pincode.length === 6

  useEffect(() => {
    if (delivery.pincode.length < 6) {
      if (delivery.city || delivery.state) {
        onChange('city', '')
        onChange('state', '')
      }
      return
    }

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setPincodeLoading(true)
      const result = await lookupPincode(delivery.pincode)
      if (result) {
        onChange('city', result.city)
        onChange('state', result.state)
      }
      setPincodeLoading(false)
    }, 400)

    return () => clearTimeout(debounceRef.current)
  }, [delivery.pincode, onChange])

  const field = (key, placeholder, maxLength) => (
    <div className="checkout-input-row">
      <input
        type="text"
        placeholder={placeholder}
        value={delivery[key] || ''}
        maxLength={maxLength}
        onChange={(e) => onChange(key, e.target.value)}
        className={`checkout-input ${errors[key] ? 'checkout-input--error' : ''}`}
      />
      {errors[key] && <p className="checkout-error">{errors[key]}</p>}
    </div>
  )

  const req = (required) => (required ? '*' : ' (optional)')

  return (
    <div className="checkout-section">
      <h2 className="checkout-section__title">Delivery</h2>
      {field('name', `Full Name${req(true)}`, config.nameMaxLength)}

      {config.houseNumberEnabled && field(
        'houseNumber',
        `${config.houseNumberLabel}${req(config.houseNumberRequired)}`,
        config.houseNumberMaxLength
      )}

      {config.streetEnabled && field(
        'street',
        `${config.streetLabel}${req(config.streetRequired)}`,
        config.streetMaxLength
      )}

      {config.landmarkEnabled && field(
        'landmark',
        `${config.landmarkLabel}${req(config.landmarkRequired)}`,
        config.landmarkMaxLength
      )}

      <div className="checkout-input-row pincode-wrap">
        <input
          type="tel"
          placeholder="Pincode*"
          value={delivery.pincode}
          maxLength={6}
          onChange={(e) => onChange('pincode', e.target.value.replace(/\D/g, ''))}
          className={`checkout-input ${errors.pincode ? 'checkout-input--error' : ''}`}
        />
        {pincodeLoading && <span className="pincode-loading">Looking up...</span>}
        {errors.pincode && <p className="checkout-error">{errors.pincode}</p>}
      </div>

      {showLocationFields && (
        <div className="checkout-city-state-row">
          <div className="checkout-input-row">
            <input
              type="text"
              placeholder="City*"
              value={delivery.city}
              readOnly
              className={`checkout-input checkout-input--readonly ${errors.city ? 'checkout-input--error' : ''}`}
            />
            {errors.city && <p className="checkout-error">{errors.city}</p>}
          </div>
          <div className="checkout-input-row">
            <input
              type="text"
              placeholder="State*"
              value={delivery.state}
              readOnly
              className={`checkout-input checkout-input--readonly ${errors.state ? 'checkout-input--error' : ''}`}
            />
            {errors.state && <p className="checkout-error">{errors.state}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
