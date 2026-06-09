import React from 'react'

export default function Loader({ message = 'Loading...', fullScreen = true, overlay = false }) {
  return (
    <div
      className={`loader${fullScreen ? ' loader--fullscreen' : ''}${overlay ? ' loader--overlay' : ''}`}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="loader__spinner" />
      {message && <p className="loader__message">{message}</p>}
    </div>
  )
}
