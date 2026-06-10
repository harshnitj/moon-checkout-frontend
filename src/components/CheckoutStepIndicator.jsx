import React from 'react'

const STEPS = [
  { id: 1, label: 'Cart & Contact' },
  { id: 2, label: 'Address' },
  { id: 3, label: 'Payment' },
]

export default function CheckoutStepIndicator({ currentStep }) {
  return (
    <nav className="checkout-steps" aria-label="Checkout progress">
      {STEPS.map((step, index) => {
        const isComplete = currentStep > step.id
        const isActive = currentStep === step.id
        return (
          <div
            key={step.id}
            className={`checkout-steps__item${isActive ? ' checkout-steps__item--active' : ''}${isComplete ? ' checkout-steps__item--complete' : ''}`}
          >
            <span className="checkout-steps__dot" aria-hidden="true">
              {isComplete ? '✓' : step.id}
            </span>
            <span className="checkout-steps__label">{step.label}</span>
            {index < STEPS.length - 1 && <span className="checkout-steps__line" aria-hidden="true" />}
          </div>
        )
      })}
    </nav>
  )
}
