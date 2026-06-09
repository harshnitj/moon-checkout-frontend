export function parseCodChargeRules(settings) {
  const raw = settings?.codChargeRules
  if (!raw) return []

  const rules = Array.isArray(raw) ? raw : []
  return rules
    .map((rule) => ({
      id: rule.id,
      minCartPaise: Number(rule.minCartPaise) || 0,
      maxCartPaise: rule.maxCartPaise == null ? null : Number(rule.maxCartPaise),
      chargePaise: Number(rule.chargePaise) || 0,
    }))
    .sort((a, b) => a.minCartPaise - b.minCartPaise)
}

export function getCodChargeForCart(cartValuePaise, settings) {
  if (!settings?.codChargeEnabled) return 0
  const rules = parseCodChargeRules(settings)
  const value = Number(cartValuePaise) || 0

  for (const rule of rules) {
    const withinMin = value >= rule.minCartPaise
    const withinMax = rule.maxCartPaise == null || value <= rule.maxCartPaise
    if (withinMin && withinMax) {
      return rule.chargePaise
    }
  }

  return 0
}
