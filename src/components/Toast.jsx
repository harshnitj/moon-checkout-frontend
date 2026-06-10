import { useEffect } from 'react'

export default function Toast({ toast, onDismiss, durationMs = 4500 }) {
  const message = toast?.message
  const autoDismissMs = toast?.durationMs ?? durationMs

  useEffect(() => {
    if (!message) return undefined
    const timer = setTimeout(onDismiss, autoDismissMs)
    return () => clearTimeout(timer)
  }, [message, onDismiss, autoDismissMs])

  if (!message) return null

  const variant = toast?.variant || 'warning'

  return (
    <div className={`checkout-toast checkout-toast--${variant}`} role="status" aria-live="polite">
      {variant === 'gift' ? (
        <span className="checkout-toast__gift" aria-hidden="true">🎁</span>
      ) : (
        <span className="checkout-toast__icon" aria-hidden="true">ℹ</span>
      )}
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
