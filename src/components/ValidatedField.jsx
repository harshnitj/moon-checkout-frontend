import React from 'react'
import FieldValidTick from './FieldValidTick'
import FieldInvalidIcon from './FieldInvalidIcon'

export default function ValidatedField({ status = 'neutral', className = '', children }) {
  const wrapClass = [
    'checkout-input-wrap',
    status === 'valid' && 'checkout-input-wrap--valid',
    status === 'invalid-red' && 'checkout-input-wrap--invalid-red',
    status === 'invalid-yellow' && 'checkout-input-wrap--invalid-yellow',
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className={wrapClass}>
      {children}
      {status === 'valid' && <FieldValidTick />}
      {status === 'invalid-red' && <FieldInvalidIcon tone="red" />}
      {status === 'invalid-yellow' && <FieldInvalidIcon tone="yellow" />}
    </div>
  )
}
