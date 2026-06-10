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

const CONTACT_STEP_FIELDS = ['email', 'phone']
const ADDRESS_STEP_FIELDS = ['name', 'houseNumber', 'street', 'landmark', 'pincode', 'city', 'state']

function pickErrors(allErrors, keys) {
  const errors = {}
  for (const key of keys) {
    if (allErrors[key]) errors[key] = allErrors[key]
  }
  return errors
}

export function validateContactStep(formValues, settings = DEFAULT_CHECKOUT_SETTINGS) {
  return pickErrors(validateCheckoutForm(formValues, settings), CONTACT_STEP_FIELDS)
}

export function validateAddressStep(formValues, settings = DEFAULT_CHECKOUT_SETTINGS) {
  return pickErrors(validateCheckoutForm(formValues, settings), ADDRESS_STEP_FIELDS)
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const RED_INVALID_FIELDS = new Set(['email', 'phone', 'pincode'])

function isRedInvalidField(fieldKey) {
  return RED_INVALID_FIELDS.has(fieldKey)
}

function hasFieldInput(fieldKey, { email, phone, delivery }) {
  switch (fieldKey) {
    case 'email':
      return !!email.trim()
    case 'phone':
      return !!String(phone || '').replace(/\D/g, '')
    case 'name':
      return !!delivery.name?.trim()
    case 'houseNumber':
      return !!delivery.houseNumber?.trim()
    case 'street':
      return !!delivery.street?.trim()
    case 'landmark':
      return !!delivery.landmark?.trim()
    case 'pincode':
      return !!delivery.pincode?.length
    case 'city':
      return !!delivery.city?.trim()
    case 'state':
      return !!delivery.state?.trim()
    default:
      return false
  }
}

export function getFieldStatus(fieldKey, formValues, settings = DEFAULT_CHECKOUT_SETTINGS, fieldError = '') {
  if (isFieldValid(fieldKey, formValues, settings) && !fieldError) {
    return 'valid'
  }

  if (fieldError || hasFieldInput(fieldKey, formValues)) {
    return isRedInvalidField(fieldKey) ? 'invalid-red' : 'invalid-yellow'
  }

  return 'neutral'
}

export function isFieldValid(fieldKey, { email, phone, delivery }, settings = DEFAULT_CHECKOUT_SETTINGS) {
  const config = { ...DEFAULT_CHECKOUT_SETTINGS, ...settings }

  switch (fieldKey) {
    case 'email': {
      if (config.emailEnabled === false) return false
      const trimmed = email.trim()
      if (!trimmed) return false
      return EMAIL_PATTERN.test(trimmed)
    }
    case 'phone': {
      const phoneDigits = String(phone || '').replace(/\D/g, '')
      if (!phoneDigits || phoneDigits.length !== config.phoneLength) return false
      if (config.phoneStartDigits && !config.phoneStartDigits.includes(phoneDigits[0])) return false
      return true
    }
    case 'name': {
      const name = delivery.name?.trim() || ''
      if (!name) return false
      return name.length >= config.nameMinLength && name.length <= config.nameMaxLength
    }
    case 'houseNumber': {
      if (!config.houseNumberEnabled) return false
      const value = delivery.houseNumber?.trim() || ''
      if (!value) return false
      return value.length <= config.houseNumberMaxLength
    }
    case 'street': {
      if (!config.streetEnabled) return false
      const value = delivery.street?.trim() || ''
      if (!value) return false
      return value.length <= config.streetMaxLength
    }
    case 'landmark': {
      if (!config.landmarkEnabled) return false
      const value = delivery.landmark?.trim() || ''
      if (!value) return false
      return value.length <= config.landmarkMaxLength
    }
    case 'pincode':
      return delivery.pincode?.length === 6
        && !!delivery.city?.trim()
        && !!delivery.state?.trim()
    case 'city':
      return !!delivery.city?.trim()
    case 'state':
      return !!delivery.state?.trim()
    default:
      return false
  }
}
