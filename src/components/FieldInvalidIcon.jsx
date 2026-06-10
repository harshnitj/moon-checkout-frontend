import React from 'react'

export default function FieldInvalidIcon({ tone = 'red' }) {
  return (
    <span className={`checkout-field-invalid checkout-field-invalid--${tone}`} aria-hidden="true">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 8v5M12 16h.01"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  )
}
