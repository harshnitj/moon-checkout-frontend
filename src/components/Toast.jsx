import { useEffect } from 'react'

export default function Toast({ message, onDismiss, durationMs = 4000 }) {
  useEffect(() => {
    if (!message) return undefined
    const timer = setTimeout(onDismiss, durationMs)
    return () => clearTimeout(timer)
  }, [message, onDismiss, durationMs])

  if (!message) return null

  return (
    <div className="checkout-toast" role="status" aria-live="polite">
      <span className="checkout-toast__icon" aria-hidden="true">ℹ</span>
      <p className="checkout-toast__text">{message}</p>
      <button
        type="button"
        className="checkout-toast__dismiss"
        onClick={onDismiss}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}
