const SHOPIFY_FIELD_MAP = {
  'customer.phone_number': 'phone',
  'customer.phone': 'phone',
  'customer.email': 'email',
  email: 'email',
  phone: 'phone',
  'shipping_address.phone': 'phone',
  'shipping_address.zip': 'pincode',
  'shipping_address.city': 'city',
  'shipping_address.province': 'state',
  'shipping_address.address1': 'address1',
  'shipping_address.first_name': 'name',
  'shipping_address.last_name': 'name',
  'billing_address.phone': 'phone',
  'billing_address.zip': 'pincode',
}

function humanizeField(field) {
  return String(field)
    .replace(/[._]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatErrorValue(value) {
  if (Array.isArray(value)) return value.map(String).join(', ')
  if (value && typeof value === 'object') return formatErrorObject(value)
  return String(value)
}

function formatErrorObject(obj, messages = [], fieldErrors = {}) {
  for (const [key, value] of Object.entries(obj)) {
    if (key === 'errors' && value && typeof value === 'object' && !Array.isArray(value)) {
      for (const [field, fieldValue] of Object.entries(value)) {
        const text = formatErrorValue(fieldValue)
        const mappedField = SHOPIFY_FIELD_MAP[field]
        if (mappedField) {
          fieldErrors[mappedField] = fieldErrors[mappedField]
            ? `${fieldErrors[mappedField]}. ${text}`
            : text
        } else {
          messages.push(`${humanizeField(field)}: ${text}`)
        }
      }
      continue
    }

    const mappedField = SHOPIFY_FIELD_MAP[key]
    const text = formatErrorValue(value)
    if (mappedField) {
      fieldErrors[mappedField] = fieldErrors[mappedField]
        ? `${fieldErrors[mappedField]}. ${text}`
        : text
    } else if (text) {
      messages.push(`${humanizeField(key)}: ${text}`)
    }
  }

  return { messages, fieldErrors }
}

export function parseApiError(err) {
  const data = err?.response?.data
  const messages = []
  const fieldErrors = {}

  if (!data) {
    return {
      message: err?.message || 'Something went wrong. Please try again.',
      fieldErrors,
    }
  }

  if (typeof data.message === 'string' && data.message.trim()) {
    messages.push(data.message.trim())
  }

  if (typeof data.error === 'string' && data.error.trim()) {
    messages.push(data.error.trim())
  }

  if (typeof data.details === 'string' && data.details.trim()) {
    messages.push(data.details.trim())
  }

  if (Array.isArray(data.details)) {
    messages.push(...data.details.map((item) => formatErrorValue(item)).filter(Boolean))
  } else if (data.details && typeof data.details === 'object') {
    const parsed = formatErrorObject(data.details, [], {})
    messages.push(...parsed.messages)
    Object.assign(fieldErrors, parsed.fieldErrors)
  }

  if (data.errors) {
    if (typeof data.errors === 'string') {
      messages.push(data.errors)
    } else if (typeof data.errors === 'object') {
      const parsed = formatErrorObject({ errors: data.errors }, [], {})
      messages.push(...parsed.messages)
      Object.assign(fieldErrors, parsed.fieldErrors)
    }
  }

  const uniqueMessages = [...new Set(messages.filter(Boolean))]

  return {
    message: uniqueMessages.join('. ') || 'Something went wrong. Please try again.',
    fieldErrors,
  }
}
