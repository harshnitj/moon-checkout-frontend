import React from 'react'

const BADGES = [
  { icon: '🛡️', label: 'Secure' },
  { icon: '↩️', label: '7-Day Return' },
  { icon: '⚡', label: 'Fast Ship' },
]

export default function TrustBadges({ compact = false }) {
  return (
    <div className={`trust-badges${compact ? ' trust-badges--compact' : ''}`}>
      {BADGES.map((badge) => (
        <div key={badge.label} className="trust-badges__item">
          <span className="trust-badges__icon" aria-hidden="true">{badge.icon}</span>
          <span className="trust-badges__label">{badge.label}</span>
        </div>
      ))}
    </div>
  )
}
