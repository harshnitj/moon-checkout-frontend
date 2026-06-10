import React from 'react'
import CheckoutHeader from './CheckoutHeader'
import CheckoutStepIndicator from './CheckoutStepIndicator'
import CartSummary from './CartSummary'
import ContactForm from './ContactForm'
import DeliveryForm from './DeliveryForm'
import PaymentMethod from './PaymentMethod'
import CouponsSection from './CouponsSection'
import BillDetails from './BillDetails'
import StepFooter from './StepFooter'
import OrderErrorBanner from './OrderErrorBanner'
import Toast from './Toast'

export default function ThreeStepCheckout({
  currentStep,
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
  onBack,
  onContinue,
  onPlaceOrder,
  onDismissError,
  onDismissToast,
  onCheckoutClose,
}) {
  return (
    <div className="checkout-page checkout-page--steps">
      <CheckoutHeader
        showBackArrow
        onBackClick={
          currentStep > 1
            ? onBack
            : () => {
                onCheckoutClose?.()
                window.parent.postMessage({ type: 'MOON_CHECKOUT_CLOSE' }, '*')
              }
        }
        shopName={shopName}
        shopLogoUrl={shopLogoUrl}
      />
      <CheckoutStepIndicator currentStep={currentStep} />
      <OrderErrorBanner message={orderError} onDismiss={onDismissError} />

      {currentStep === 1 && (
        <>
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
        </>
      )}

      {currentStep === 2 && (
        <DeliveryForm
          delivery={delivery}
          onChange={onDeliveryChange}
          errors={errors}
          settings={checkoutSettings}
        />
      )}

      {currentStep === 3 && (
        <>
          <PaymentMethod
            selected={paymentMethod}
            onChange={onPaymentMethodChange}
            cartData={cartData}
            settings={checkoutSettings}
            rtoContext={rtoContext}
          />
          <CouponsSection />
          <BillDetails
            cartData={cartData}
            paymentMethod={paymentMethod}
            settings={checkoutSettings}
          />
        </>
      )}

      <StepFooter
        step={currentStep}
        total={finalTotal}
        onContinue={onContinue}
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
