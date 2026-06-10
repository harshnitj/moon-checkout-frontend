const DEFAULT_RTO_SETTINGS = {
  rtoEngineEnabled: false,
  rtoDefaultBlockMessage: 'This payment method is not available for your order.',
  rtoMitigationPincodeEnabled: false,
  rtoBlockedPincodes: [],
  rtoPincodeBlockCod: true,
  rtoPincodeBlockAdvance: true,
  rtoPincodeBlockOnline: false,
  rtoMitigationPhoneEnabled: false,
  rtoBlockedPhonePrefixes: [],
  rtoPhoneBlockCod: true,
  rtoPhoneBlockAdvance: false,
  rtoPhoneBlockOnline: false,
  rtoMitigationProductEnabled: false,
  rtoBlockedProductIds: [],
  rtoProductBlockCod: true,
  rtoProductBlockAdvance: true,
  rtoProductBlockOnline: false,
  rtoMitigationCollectionEnabled: false,
  rtoBlockedCollectionIds: [],
  rtoCollectionProductIds: [],
  rtoCollectionBlockCod: true,
  rtoCollectionBlockAdvance: true,
  rtoCollectionBlockOnline: false,
  rtoMitigationStateEnabled: false,
  rtoBlockedStates: [],
  rtoStateBlockCod: true,
  rtoStateBlockAdvance: false,
  rtoStateBlockOnline: false,
  rtoRules: [],
}

function parseStringList(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.map((value) => String(value || '').trim()).filter(Boolean)
  return []
}

function parseIdList(raw) {
  return parseStringList(raw)
    .map((value) => Number(String(value).replace(/\D/g, '')))
    .filter((value) => Number.isFinite(value) && value > 0)
}

function parsePincodeList(raw) {
  return parseStringList(raw)
    .map((value) => String(value).replace(/\D/g, '').slice(0, 6))
    .filter((value) => value.length === 6)
}

function normalizePhoneDigits(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  if (digits.length >= 10) return digits.slice(-10)
  return digits
}

function normalizeState(state) {
  return String(state || '').trim().toLowerCase()
}

export function buildRtoContext({ delivery = {}, phone = '', cartData = null } = {}) {
  const productIds = (cartData?.items || [])
    .map((item) => Number(item.productId))
    .filter((value) => Number.isFinite(value) && value > 0)

  return {
    cartTotalPaise: Number(cartData?.totalPrice) || 0,
    productIds,
    pincode: String(delivery.pincode || '').replace(/\D/g, '').slice(0, 6),
    phone: normalizePhoneDigits(phone),
    state: normalizeState(delivery.state),
  }
}

function matchesPhonePrefix(phone, prefixes) {
  if (!phone || !prefixes.length) return false
  return prefixes.some((prefix) => phone.startsWith(String(prefix).replace(/\D/g, '')))
}

function matchesProductIds(cartProductIds, blockedIds) {
  if (!blockedIds.length || !cartProductIds.length) return false
  const blocked = new Set(blockedIds)
  return cartProductIds.some((id) => blocked.has(id))
}

function applyMethodBlocks(result, actions) {
  if (actions.blockCheckout) {
    result.blockCheckout = true
    result.blockedMethods.add('cod')
    result.blockedMethods.add('advance')
    result.blockedMethods.add('online')
  }
  if (actions.blockCod) result.blockedMethods.add('cod')
  if (actions.blockAdvance) result.blockedMethods.add('advance')
  if (actions.blockOnline) result.blockedMethods.add('online')
  if (actions.message) result.messages.push(actions.message)
}

function evaluateGlobalMitigations(settings, context) {
  const result = { blockedMethods: new Set(), blockCheckout: false, messages: [] }
  const defaultMessage = settings.rtoDefaultBlockMessage || DEFAULT_RTO_SETTINGS.rtoDefaultBlockMessage

  if (settings.rtoMitigationPincodeEnabled && context.pincode) {
    const pincodes = parsePincodeList(settings.rtoBlockedPincodes)
    if (pincodes.includes(context.pincode)) {
      applyMethodBlocks(result, {
        blockCod: settings.rtoPincodeBlockCod !== false,
        blockAdvance: settings.rtoPincodeBlockAdvance !== false,
        blockOnline: !!settings.rtoPincodeBlockOnline,
        blockCheckout: false,
        message: defaultMessage,
      })
    }
  }

  if (settings.rtoMitigationPhoneEnabled && context.phone) {
    const prefixes = parseStringList(settings.rtoBlockedPhonePrefixes)
    if (matchesPhonePrefix(context.phone, prefixes)) {
      applyMethodBlocks(result, {
        blockCod: settings.rtoPhoneBlockCod !== false,
        blockAdvance: !!settings.rtoPhoneBlockAdvance,
        blockOnline: !!settings.rtoPhoneBlockOnline,
        blockCheckout: false,
        message: defaultMessage,
      })
    }
  }

  if (settings.rtoMitigationProductEnabled) {
    const productIds = parseIdList(settings.rtoBlockedProductIds)
    if (matchesProductIds(context.productIds, productIds)) {
      applyMethodBlocks(result, {
        blockCod: settings.rtoProductBlockCod !== false,
        blockAdvance: settings.rtoProductBlockAdvance !== false,
        blockOnline: !!settings.rtoProductBlockOnline,
        blockCheckout: false,
        message: defaultMessage,
      })
    }
  }

  if (settings.rtoMitigationCollectionEnabled) {
    const collectionProductIds = parseIdList(settings.rtoCollectionProductIds)
    if (matchesProductIds(context.productIds, collectionProductIds)) {
      applyMethodBlocks(result, {
        blockCod: settings.rtoCollectionBlockCod !== false,
        blockAdvance: settings.rtoCollectionBlockAdvance !== false,
        blockOnline: !!settings.rtoCollectionBlockOnline,
        blockCheckout: false,
        message: defaultMessage,
      })
    }
  }

  if (settings.rtoMitigationStateEnabled && context.state) {
    const states = parseStringList(settings.rtoBlockedStates).map(normalizeState)
    if (states.includes(context.state)) {
      applyMethodBlocks(result, {
        blockCod: settings.rtoStateBlockCod !== false,
        blockAdvance: !!settings.rtoStateBlockAdvance,
        blockOnline: !!settings.rtoStateBlockOnline,
        blockCheckout: false,
        message: defaultMessage,
      })
    }
  }

  return result
}

function ruleConditionMatches(rule, context, collectionProductIds) {
  const checks = []
  const pincodes = parsePincodeList(rule.pincodes)
  const phonePrefixes = parseStringList(rule.phonePrefixes)
  const productIds = parseIdList(rule.productIds)
  const collectionIds = parseIdList(rule.collectionIds)
  const states = parseStringList(rule.states).map(normalizeState)

  if (pincodes.length) checks.push(context.pincode && pincodes.includes(context.pincode))
  if (phonePrefixes.length) checks.push(matchesPhonePrefix(context.phone, phonePrefixes))
  if (productIds.length) checks.push(matchesProductIds(context.productIds, productIds))
  if (collectionIds.length && collectionProductIds.length) {
    checks.push(matchesProductIds(context.productIds, collectionProductIds))
  }
  if (states.length) checks.push(context.state && states.includes(context.state))
  if (rule.minCartPaise != null) checks.push(context.cartTotalPaise >= rule.minCartPaise)
  if (rule.maxCartPaise != null) checks.push(context.cartTotalPaise <= rule.maxCartPaise)

  if (!checks.length) return false
  return rule.matchMode === 'all' ? checks.every(Boolean) : checks.some(Boolean)
}

function evaluateAdvancedRules(settings, context) {
  const result = { blockedMethods: new Set(), blockCheckout: false, messages: [] }
  const defaultMessage = settings.rtoDefaultBlockMessage || DEFAULT_RTO_SETTINGS.rtoDefaultBlockMessage
  const collectionProductIds = parseIdList(settings.rtoCollectionProductIds)
  const rules = Array.isArray(settings.rtoRules) ? settings.rtoRules.filter((rule) => rule.enabled !== false) : []

  for (const rule of rules) {
    if (!ruleConditionMatches(rule, context, collectionProductIds)) continue
    applyMethodBlocks(result, {
      blockCod: rule.blockCod !== false,
      blockAdvance: !!rule.blockAdvance,
      blockOnline: !!rule.blockOnline,
      blockCheckout: !!rule.blockCheckout,
      message: rule.message || defaultMessage,
    })
  }

  return result
}

export function evaluateRto(settings = {}, context = {}) {
  if (!settings.rtoEngineEnabled) {
    return { blockedMethods: [], blockCheckout: false, messages: [], reason: null }
  }

  const normalizedContext = {
    cartTotalPaise: Number(context.cartTotalPaise) || 0,
    productIds: context.productIds || [],
    pincode: String(context.pincode || '').replace(/\D/g, '').slice(0, 6),
    phone: normalizePhoneDigits(context.phone),
    state: normalizeState(context.state),
  }

  const global = evaluateGlobalMitigations(settings, normalizedContext)
  const advanced = evaluateAdvancedRules(settings, normalizedContext)
  const blockedMethods = new Set([...global.blockedMethods, ...advanced.blockedMethods])
  const messages = [...new Set([...global.messages, ...advanced.messages].filter(Boolean))]
  const defaultMessage = settings.rtoDefaultBlockMessage || DEFAULT_RTO_SETTINGS.rtoDefaultBlockMessage

  return {
    blockedMethods: [...blockedMethods],
    blockCheckout: global.blockCheckout || advanced.blockCheckout,
    messages,
    reason: messages[0] || defaultMessage,
  }
}

export function filterPaymentMethodsByRto(methods, settings, context) {
  const evaluation = evaluateRto(settings, context)
  if (evaluation.blockCheckout) return []
  return methods.filter((method) => !evaluation.blockedMethods.includes(method))
}

export function getRtoNotice(settings, context) {
  const evaluation = evaluateRto(settings, context)
  if (!evaluation.blockedMethods.length && !evaluation.blockCheckout) return null
  return evaluation.reason
}
