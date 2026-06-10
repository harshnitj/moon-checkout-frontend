import React, { useState, useEffect, useRef } from 'react'
import { lookupPincode } from '../services/pincode'
import { DEFAULT_CHECKOUT_SETTINGS } from '../utils/payment'
import { getFieldStatus } from '../utils/formValidation'
import ValidatedField from './ValidatedField'

export default function DeliveryForm({ delivery, onChange, errors, settings = DEFAULT_CHECKOUT_SETTINGS }) {
  const [pincodeLoading, setPincodeLoading] = useState(false)
  const debounceRef = useRef(null)
  const config = { ...DEFAULT_CHECKOUT_SETTINGS, ...settings }
  const showLocationFields = delivery.pincode.length === 6
  const formValues = { email: '', phone: '', delivery }

  function getStatus(fieldKey) {
    if (fieldKey === 'pincode' && pincodeLoading && delivery.pincode.length === 6) {
      return 'neutral'
    }
    return getFieldStatus(fieldKey, formValues, config, errors[fieldKey])
  }

  const field = (key, placeholder, maxLength) => (
    <div className="checkout-input-row">
      <ValidatedField status={getStatus(key)}>
        <input
          type="text"
          placeholder={placeholder}
          value={delivery[key] || ''}
          maxLength={maxLength}
          onChange={(e) => onChange(key, e.target.value)}
          className="checkout-input"
        />
      </ValidatedField>
      {errors[key] && <p className="checkout-error">{errors[key]}</p>}
    </div>
  )

  const req = (required) => (required ? '*' : ' (optional)')

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

      <div className="checkout-input-row">
        <label className="checkout-label">Pincode*</label>
        <ValidatedField status={getStatus('pincode')} className="pincode-input-wrap">
          <input
            type="tel"
            value={delivery.pincode}
            maxLength={6}
            onChange={(e) => onChange('pincode', e.target.value.replace(/\D/g, ''))}
            className="checkout-input"
          />
          {pincodeLoading && <span className="pincode-loading">Looking up...</span>}
        </ValidatedField>
        {errors.pincode && <p className="checkout-error">{errors.pincode}</p>}
      </div>

      {showLocationFields && (
        <div className="checkout-city-state-row">
          <div className="checkout-input-row">
            <label className="checkout-label">City*</label>
            <ValidatedField status={getStatus('city')}>
              <input
                type="text"
                value={delivery.city}
                readOnly
                className="checkout-input checkout-input--readonly"
              />
            </ValidatedField>
            {errors.city && <p className="checkout-error">{errors.city}</p>}
          </div>
          <div className="checkout-input-row">
            <label className="checkout-label">State*</label>
            <ValidatedField status={getStatus('state')}>
              <input
                type="text"
                value={delivery.state}
                readOnly
                className="checkout-input checkout-input--readonly"
              />
            </ValidatedField>
            {errors.state && <p className="checkout-error">{errors.state}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
