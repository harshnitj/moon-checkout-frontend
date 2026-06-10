export const DEFAULT_THEME_COLORS = {
  colorPrimary: '#2563eb',
  colorPrimaryHover: '#1d4ed8',
  colorBackground: '#f3f4f8',
  colorSurface: '#ffffff',
  colorText: '#111827',
  colorTextMuted: '#6b7280',
}

const THEME_COLOR_KEYS = Object.keys(DEFAULT_THEME_COLORS)

function lightenHex(hex, amount = 0.92) {
  const normalized = hex.replace('#', '')
  const num = parseInt(normalized, 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  const mix = (channel) => Math.round(channel + (255 - channel) * amount)
  return `#${[mix(r), mix(g), mix(b)]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')}`
}

export function resolveThemeColors(settings = {}) {
  const colors = { ...DEFAULT_THEME_COLORS }
  for (const key of THEME_COLOR_KEYS) {
    if (settings[key]) colors[key] = settings[key]
  }
  return colors
}

export function applyCheckoutTheme(settings = {}) {
  const colors = resolveThemeColors(settings)
  const root = document.documentElement

  root.style.setProperty('--primary', colors.colorPrimary)
  root.style.setProperty('--primary-hover', colors.colorPrimaryHover)
  root.style.setProperty('--primary-soft', lightenHex(colors.colorPrimary))
  root.style.setProperty('--bg', colors.colorBackground)
  root.style.setProperty('--surface', colors.colorSurface)
  root.style.setProperty('--surface-muted', lightenHex(colors.colorBackground, 0.45))
  root.style.setProperty('--text', colors.colorText)
  root.style.setProperty('--text-muted', colors.colorTextMuted)

  return colors
}
