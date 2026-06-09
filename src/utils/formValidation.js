import { DEFAULT_CHECKOUT_SETTINGS } from './payment'

export function buildShippingAddress(delivery, settings = DEFAULT_CHECKOUT_SETTINGS) {
  const config = { ...DEFAULT_CHECKOUT_SETTINGS, ...settings }
  const parts = []

  if (config.houseNumberEnabled && delivery.houseNumber?.trim()) {
    parts.push(delivery.houseNumber.trim())
  }
  if (config.streetEnabled && delivery.street?.trim()) {
    parts.push(delivery.street.trim())
  }

  const address1 = parts.join(', ') || delivery.street?.trim() || delivery.address1?.trim() || ''
  const address2 = config.landmarkEnabled ? (delivery.landmark?.trim() || '') : (delivery.address2?.trim() || '')

  return {
    address1,
    address2,
    city: delivery.city,
    province: delivery.state,
    zip: delivery.pincode,
  }
}

export function validateCheckoutForm({ email, phone, delivery }, settings = DEFAULT_CHECKOUT_SETTINGS) {
  const config = { ...DEFAULT_CHECKOUT_SETTINGS, ...settings }
  const errors = {}

  if (config.emailEnabled !== false) {
    if (config.emailRequired) {
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = 'Enter a valid email address'
      }
    } else if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Enter a valid email address'
    }
  }

  const phoneDigits = String(phone || '').replace(/\D/g, '')
  if (!phoneDigits) {
    errors.phone = 'Mobile number is required'
  } else if (phoneDigits.length !== config.phoneLength) {
    errors.phone = `Enter a valid ${config.phoneLength}-digit mobile number`
  } else if (config.phoneStartDigits && !config.phoneStartDigits.includes(phoneDigits[0])) {
    errors.phone = `Mobile number must start with ${config.phoneStartDigits.split('').join(', ')}`
  }

  const name = delivery.name?.trim() || ''
  if (!name) {
    errors.name = 'Full name is required'
  } else if (name.length < config.nameMinLength) {
    errors.name = `Name must be at least ${config.nameMinLength} characters`
  } else if (name.length > config.nameMaxLength) {
    errors.name = `Name must be at most ${config.nameMaxLength} characters`
  }

  if (config.houseNumberEnabled) {
    const value = delivery.houseNumber?.trim() || ''
    if (config.houseNumberRequired && !value) {
      errors.houseNumber = `${config.houseNumberLabel} is required`
    } else if (value && value.length > config.houseNumberMaxLength) {
      errors.houseNumber = `Maximum ${config.houseNumberMaxLength} characters allowed`
    }
  }

  if (config.streetEnabled) {
    const value = delivery.street?.trim() || ''
    if (config.streetRequired && !value) {
      errors.street = `${config.streetLabel} is required`
    } else if (value && value.length > config.streetMaxLength) {
      errors.street = `Maximum ${config.streetMaxLength} characters allowed`
    }
  }

  if (config.landmarkEnabled) {
    const value = delivery.landmark?.trim() || ''
    if (config.landmarkRequired && !value) {
      errors.landmark = `${config.landmarkLabel} is required`
    } else if (value && value.length > config.landmarkMaxLength) {
      errors.landmark = `Maximum ${config.landmarkMaxLength} characters allowed`
    }
  }

  if (!delivery.pincode || delivery.pincode.length !== 6) {
    errors.pincode = 'Enter a valid 6-digit pincode'
  }

  if (!delivery.city?.trim()) errors.city = 'City is required'
  if (!delivery.state?.trim()) errors.state = 'State is required'

  return errors
}
