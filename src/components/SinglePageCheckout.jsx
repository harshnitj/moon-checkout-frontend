import React from 'react'
import CheckoutHeader from './CheckoutHeader'
import CartSummary from './CartSummary'
import ContactForm from './ContactForm'
import DeliveryForm from './DeliveryForm'
import PaymentMethod from './PaymentMethod'
import BillDetails from './BillDetails'
import StickyFooter from './StickyFooter'
import OrderErrorBanner from './OrderErrorBanner'
import Toast from './Toast'

export default function SinglePageCheckout({
  cartData,
  shopName,
  shopLogoUrl,
  phone,
  email,
  delivery,
  paymentMethod,
  errors,
  checkoutSettings,
  rtoContext,
  orderError,
  toast,
  finalTotal,
  advancePayNow,
  loading,
  loadingMessage,
  onPhoneChange,
  onEmailChange,
  onDeliveryChange,
  onPaymentMethodChange,
  onPlaceOrder,
  onDismissError,
  onDismissToast,
  onCheckoutClose,
}) {
  return (
    <div className="checkout-page">
      <CheckoutHeader
        showBackArrow
        onBackClick={() => {
          onCheckoutClose?.()
          window.parent.postMessage({ type: 'MOON_CHECKOUT_CLOSE' }, '*')
        }}
        shopName={shopName}
        shopLogoUrl={shopLogoUrl}
      />
      <OrderErrorBanner message={orderError} onDismiss={onDismissError} />
      <CartSummary cartData={cartData} />
      <ContactForm
        phone={phone}
        email={email}
        onPhoneChange={onPhoneChange}
        onEmailChange={onEmailChange}
        phoneError={errors.phone}
        emailError={errors.email}
        settings={checkoutSettings}
      />
      <DeliveryForm
        delivery={delivery}
        onChange={onDeliveryChange}
        errors={errors}
        settings={checkoutSettings}
      />
      <PaymentMethod
        selected={paymentMethod}
        onChange={onPaymentMethodChange}
        cartData={cartData}
        settings={checkoutSettings}
        rtoContext={rtoContext}
      />
      <BillDetails cartData={cartData} paymentMethod={paymentMethod} settings={checkoutSettings} />
      <StickyFooter
        total={finalTotal}
        onPlaceOrder={onPlaceOrder}
        loading={loading}
        loadingMessage={loadingMessage}
        paymentMethod={paymentMethod}
        advancePayNow={advancePayNow}
      />
      <Toast toast={toast} onDismiss={onDismissToast} />
    </div>
  )
}
