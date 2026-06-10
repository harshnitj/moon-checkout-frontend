import React from 'react'

export default function Loader({
  message = 'Loading...',
  submessage,
  fullScreen = true,
  overlay = false,
  size = 'md',
}) {
  return (
    <div
      className={`loader${fullScreen ? ' loader--fullscreen' : ''}${overlay ? ' loader--overlay' : ''}`}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className={`loader__spinner${size === 'sm' ? ' loader__spinner--sm' : ''}`} />
      {message && <p className="loader__message">{message}</p>}
      {submessage && <p className="loader__submessage">{submessage}</p>}
    </div>
  )
}
