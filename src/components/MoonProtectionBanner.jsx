import React from 'react'

export default function MoonProtectionBanner() {
  return (
    <div className="moon-protection">
      <div>
        <p className="moon-protection__title">Moon Protection</p>
        <p className="moon-protection__text">
          Your transaction is protected by bank-grade encryption.
        </p>
      </div>
      <span className="moon-protection__icon" aria-hidden="true">🛡️</span>
    </div>
  )
}
