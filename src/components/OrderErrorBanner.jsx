export default function OrderErrorBanner({ message, onDismiss }) {
  if (!message) return null

  return (
    <div className="checkout-api-error" role="alert">
      <p className="checkout-api-error__text">{message}</p>
      <button
        type="button"
        className="checkout-api-error__dismiss"
        onClick={onDismiss}
        aria-label="Dismiss error"
      >
        ×
      </button>
    </div>
  )
}
