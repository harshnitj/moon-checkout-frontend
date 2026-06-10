import React, { useState, useCallback, useEffect, useMemo } from 'react'

import './styles/global.css'

import './styles/checkout.css'

import { useCartBridge } from './hooks/useCartBridge'

import { createOrder, createRazorpayOrder, verifyRazorpayPayment } from './services/api'
import { fetchCheckoutConfig } from './services/checkoutConfig'

import CheckoutHeader from './components/CheckoutHeader'
import OrderSuccessPage from './components/OrderSuccessPage'
import SinglePageCheckout from './components/SinglePageCheckout'
import ThreeStepCheckout from './components/ThreeStepCheckout'

import Loader from './components/Loader'
import OrderErrorBanner from './components/OrderErrorBanner'
import {
  CHECKOUT_VARIANTS,
  DEFAULT_CHECKOUT_SETTINGS,
  formatPrice,
  getAvailablePaymentMethods,
  getPaymentBreakdown,
} from './utils/payment'
import { parseApiError } from './utils/parseApiError'
import {
  buildShippingAddress,
  validateCheckoutForm,
  validateContactStep,
  validateAddressStep,
} from './utils/formValidation'
import { getOrderSuccessPreview } from './utils/orderSuccessPreview'
import { resolveShopBranding } from './utils/shopBranding'
import { applyCheckoutTheme, resolveThemeColors } from './utils/theme'
import {
  buildPurchaseMarketingPayload,
  initMarketingPixels,
  trackMarketingAddPaymentInfo,
  trackMarketingInitiateCheckout,
  trackMarketingPurchase,
} from './utils/marketingEvents'
import { buildRtoContext } from './utils/rtoRules'
import {
  getFunnelSessionId,
  sendFunnelEvent,
  isPhoneCaptured,
  isAddressCaptured,
  isContactStepComplete,
} from './utils/funnelTracking'



export default function App() {

  const { cartData, shop, cartLoading } = useCartBridge()

  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  const [delivery, setDelivery] = useState({
    name: '',
    houseNumber: '',
    street: '',
    landmark: '',
    pincode: '',
    city: '',
    state: '',
  })

  const [paymentMethod, setPaymentMethod] = useState('cod')

  const [errors, setErrors] = useState({})

  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')

  const [orderError, setOrderError] = useState('')
  const [toast, setToast] = useState(null)

  const [orderSuccess, setOrderSuccess] = useState(null)
  const [checkoutSettings, setCheckoutSettings] = useState(DEFAULT_CHECKOUT_SETTINGS)
  const [shopBranding, setShopBranding] = useState({ shopName: null, shopLogoUrl: null })
  const [configLoading, setConfigLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  function handleApiError(err) {
    console.error('Order error:', err)
    const { message, fieldErrors } = parseApiError(err)
    setOrderError(message)
    if (Object.keys(fieldErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...fieldErrors }))
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }



  useEffect(() => {

    if (document.getElementById('razorpay-sdk')) return

    const script = document.createElement('script')

    script.id = 'razorpay-sdk'

    script.src = 'https://checkout.razorpay.com/v1/checkout.js'

    script.async = true

    document.body.appendChild(script)

  }, [])

  const loadCheckoutSettings = useCallback((shopDomain) => {
    if (!shopDomain) return
    setConfigLoading(true)
    fetchCheckoutConfig(shopDomain)
      .then((config) => {
        setCheckoutSettings(config.settings)
        setShopBranding({
          shopName: config.shopName || null,
          shopLogoUrl: config.shopLogoUrl || null,
        })
        setOrderError('')
      })
      .catch((err) => {
        console.error('Failed to load checkout settings:', err)
        setOrderError('Could not load store payment settings. Showing defaults.')
        setCheckoutSettings(DEFAULT_CHECKOUT_SETTINGS)
      })
      .finally(() => setConfigLoading(false))
  }, [])

  useEffect(() => {
    if (!shop) return
    loadCheckoutSettings(shop)
  }, [shop, loadCheckoutSettings])

  useEffect(() => {
    if (!cartData?.shop) return
    loadCheckoutSettings(cartData.shop)
  }, [cartData?.shop, loadCheckoutSettings])

  useEffect(() => {
    applyCheckoutTheme(checkoutSettings)
  }, [checkoutSettings])

  const rtoContext = useMemo(
    () => buildRtoContext({ delivery, phone, cartData }),
    [delivery, phone, cartData],
  )

  useEffect(() => {
    if (!cartData) return
    const available = getAvailablePaymentMethods(cartData, checkoutSettings, rtoContext)
    if (!available.includes(paymentMethod)) {
      setPaymentMethod(available[0] || 'online')
    }
  }, [cartData, checkoutSettings, paymentMethod, rtoContext])

  const handleDeliveryChange = useCallback((key, value) => {

    setDelivery((prev) => ({ ...prev, [key]: value }))

    setErrors((prev) => ({ ...prev, [key]: '' }))

  }, [])



  const previewVariant = import.meta.env.DEV
    ? (() => {
        const preview = new URLSearchParams(window.location.search).get('preview')
        if (preview === 'three-step') return CHECKOUT_VARIANTS.THREE_STEP
        if (preview === 'single-page') return CHECKOUT_VARIANTS.SINGLE_PAGE
        return null
      })()
    : null

  const effectiveCheckoutSettings = previewVariant
    ? { ...checkoutSettings, checkoutVariant: previewVariant }
    : checkoutSettings

  const isThreeStep = effectiveCheckoutSettings.checkoutVariant === CHECKOUT_VARIANTS.THREE_STEP

  useEffect(() => {
    initMarketingPixels(effectiveCheckoutSettings)
  }, [effectiveCheckoutSettings])

  const marketingContext = { shop, email, phone }

  useEffect(() => {
    if (!cartData || cartLoading || configLoading || !shop) return
    void trackMarketingInitiateCheckout(effectiveCheckoutSettings, cartData, marketingContext)
    void sendFunnelEvent({
      shop,
      event: 'session_started',
      checkoutVariant: effectiveCheckoutSettings.checkoutVariant,
      lastStep: currentStep,
      cartData,
      formValues: { email, phone, delivery },
      paymentMethod,
    })
  }, [cartData?.shop, cartLoading, configLoading, shop])

  useEffect(() => {
    if (!shop || !cartData || orderSuccess) return
    const formValues = { email, phone, delivery }

    if (isPhoneCaptured(formValues, effectiveCheckoutSettings)) {
      void sendFunnelEvent({
        shop,
        event: 'phone_captured',
        checkoutVariant: effectiveCheckoutSettings.checkoutVariant,
        lastStep: currentStep,
        cartData,
        formValues,
        paymentMethod,
      })
    }
  }, [shop, cartData, phone, orderSuccess, effectiveCheckoutSettings, currentStep, email, delivery, paymentMethod])

  useEffect(() => {
    if (!shop || !cartData || orderSuccess) return
    const formValues = { email, phone, delivery }

    if (isAddressCaptured(formValues, effectiveCheckoutSettings)) {
      void sendFunnelEvent({
        shop,
        event: 'address_completed',
        checkoutVariant: effectiveCheckoutSettings.checkoutVariant,
        lastStep: currentStep,
        cartData,
        formValues,
        paymentMethod,
      })
    }
  }, [
    shop,
    cartData,
    delivery.pincode,
    delivery.city,
    delivery.state,
    orderSuccess,
    effectiveCheckoutSettings,
    currentStep,
    email,
    phone,
    paymentMethod,
  ])

  useEffect(() => {
    if (!shop || !cartData || orderSuccess) return
    if (isThreeStep && currentStep < 3) return
    const formValues = { email, phone, delivery }
    if (!isContactStepComplete(formValues, effectiveCheckoutSettings)) return
    if (!isAddressCaptured(formValues, effectiveCheckoutSettings)) return
    void sendFunnelEvent({
      shop,
      event: 'payment_viewed',
      checkoutVariant: effectiveCheckoutSettings.checkoutVariant,
      lastStep: currentStep,
      cartData,
      formValues,
      paymentMethod,
    })
  }, [
    shop,
    cartData,
    currentStep,
    isThreeStep,
    orderSuccess,
    effectiveCheckoutSettings,
    email,
    phone,
    delivery,
    paymentMethod,
  ])

  useEffect(() => {
    if (!cartData) return
    if (isThreeStep && currentStep < 3) return
    void trackMarketingAddPaymentInfo(
      effectiveCheckoutSettings,
      cartData,
      paymentMethod,
      marketingContext,
    )
  }, [cartData, currentStep, isThreeStep, paymentMethod, effectiveCheckoutSettings, shop, email, phone])

  useEffect(() => {
    if (!orderSuccess) return
    void trackMarketingPurchase(effectiveCheckoutSettings, orderSuccess, marketingContext)
  }, [orderSuccess, effectiveCheckoutSettings, shop, email, phone])

  function validate() {
    const newErrors = validateCheckoutForm({ email, phone, delivery }, effectiveCheckoutSettings)
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  useEffect(() => {
    setCurrentStep(1)
  }, [effectiveCheckoutSettings.checkoutVariant])

  function handleStepContinue() {
    setOrderError('')
    const formValues = { email, phone, delivery }

    if (currentStep === 1) {
      const stepErrors = validateContactStep(formValues, effectiveCheckoutSettings)
      setErrors((prev) => ({ ...prev, ...stepErrors }))
      if (Object.keys(stepErrors).length > 0) {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
      void sendFunnelEvent({
        shop,
        event: 'contact_completed',
        checkoutVariant: effectiveCheckoutSettings.checkoutVariant,
        lastStep: 1,
        cartData,
        formValues,
        paymentMethod,
      })
      setCurrentStep(2)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    if (currentStep === 2) {
      const stepErrors = validateAddressStep(formValues, effectiveCheckoutSettings)
      setErrors((prev) => ({ ...prev, ...stepErrors }))
      if (Object.keys(stepErrors).length > 0) {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
      void sendFunnelEvent({
        shop,
        event: 'address_completed',
        checkoutVariant: effectiveCheckoutSettings.checkoutVariant,
        lastStep: 2,
        cartData,
        formValues,
        paymentMethod,
      })
      setCurrentStep(3)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const trackCheckoutAbandon = useCallback(() => {
    if (!shop || !cartData || orderSuccess) return
    if (!isPhoneCaptured({ email, phone, delivery }, effectiveCheckoutSettings)) return
    void sendFunnelEvent({
      shop,
      event: 'abandoned',
      checkoutVariant: effectiveCheckoutSettings.checkoutVariant,
      lastStep: currentStep,
      cartData,
      formValues: { email, phone, delivery },
      paymentMethod,
    })
  }, [
    shop,
    cartData,
    orderSuccess,
    email,
    phone,
    delivery,
    effectiveCheckoutSettings,
    currentStep,
    paymentMethod,
  ])

  useEffect(() => {
    function handlePageHide() {
      trackCheckoutAbandon()
    }
    window.addEventListener('pagehide', handlePageHide)
    return () => window.removeEventListener('pagehide', handlePageHide)
  }, [trackCheckoutAbandon])

  function handleStepBack() {
    setOrderError('')
    setCurrentStep((prev) => Math.max(1, prev - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }



  const paymentBreakdown = getPaymentBreakdown(cartData, paymentMethod, checkoutSettings)
  const {
    finalTotal,
    advancePayNow,
    cartSubtotal,
    codCharge,
    onlineDiscount,
    advanceDiscount,
  } = paymentBreakdown

  function buildOrderSuccessSnapshot(result, paymentMethodUsed, marketingEventId = null) {
    return {
      orderId: result.orderId,
      orderName: result.orderName,
      cartData,
      delivery: { ...delivery },
      email: email.trim() || `${phone}@moon-checkout.local`,
      phone,
      paymentMethod: paymentMethodUsed,
      totalPaid: paymentMethodUsed === 'advance' ? advancePayNow : finalTotal,
      orderTotal: finalTotal,
      marketingEventId,
    }
  }

  function buildOrderMarketingPayload(orderName = null) {
    return buildPurchaseMarketingPayload(
      {
        cartData,
        orderTotal: finalTotal,
        orderName,
        orderId: orderName,
        email: email.trim() || `${phone}@moon-checkout.local`,
        phone,
      },
      marketingContext,
    )
  }

  useEffect(() => {
    if (!cartData) return

    if (paymentMethod === 'online' && onlineDiscount > 0) {
      setToast({
        variant: 'gift',
        message: `Prepaid discount of ${formatPrice(onlineDiscount)} applied to your order!`,
      })
      return
    }

    if (paymentMethod === 'advance' && advanceDiscount > 0) {
      setToast({
        variant: 'gift',
        message: `Partial COD discount of ${formatPrice(advanceDiscount)} applied to your order!`,
      })
      return
    }

    const isCodPayment = paymentMethod === 'cod' || paymentMethod === 'advance'
    if (isCodPayment && codCharge > 0) {
      setToast({
        variant: 'warning',
        message: `COD charge of ${formatPrice(codCharge)} has been applied to your order`,
      })
      return
    }

    setToast(null)
  }, [paymentMethod, codCharge, onlineDiscount, advanceDiscount, cartData])



  function stopLoading() {
    setLoading(false)
    setLoadingMessage('')
  }

  async function completeRazorpayOrder(response, orderPaymentMethod) {
    setLoading(true)
    setLoadingMessage('Payment successful! Verifying...')

    try {
      await verifyRazorpayPayment({
        shop,
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature,
      })

      setLoadingMessage('Creating your order...')
      const marketing = buildOrderMarketingPayload()
      const result = await createOrder({
        shop,
        cartData,
        customer,
        shippingAddress,
        paymentMethod: orderPaymentMethod,
        orderTotalPaise: finalTotal,
        cartSubtotalPaise: cartSubtotal,
        marketing,
        funnelSessionId: getFunnelSessionId(),
      })

      if (marketing?.eventId) {
        marketing.payload.order_id = result.orderName
        marketing.payload.transaction_id = result.orderName
      }

      setOrderSuccess(buildOrderSuccessSnapshot(result, orderPaymentMethod, marketing?.eventId))
      window.parent.postMessage(
        { type: 'MOON_CHECKOUT_ORDER_SUCCESS', orderId: result.orderId, orderName: result.orderName },
        '*'
      )
    } catch (err) {
      handleApiError(err)
      stopLoading()
    }
  }

  async function openRazorpayCheckout({ amount, description, orderPaymentMethod }) {
    const razorpayKeyId = checkoutSettings.razorpayKeyId
    if (!razorpayKeyId) {
      setOrderError('Online payment is not configured for this store. Add Razorpay credentials in the merchant dashboard.')
      stopLoading()
      return
    }

    setLoading(true)
    setLoadingMessage('Preparing secure payment...')

    try {
      const rzpOrder = await createRazorpayOrder({ shop, amount })
      setLoading(false)
      setLoadingMessage('')

      const options = {
        key: rzpOrder.keyId || razorpayKeyId,
        amount,
        currency: 'INR',
        name: 'Moon Checkout',
        description,
        order_id: rzpOrder.id,
        prefill: { name: delivery.name, email, contact: phone },
        theme: { color: resolveThemeColors(checkoutSettings).colorPrimary },
        handler(response) {
          void completeRazorpayOrder(response, orderPaymentMethod)
        },
        modal: {
          ondismiss() {
            stopLoading()
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', () => {
        stopLoading()
        setOrderError('Payment failed. Please try again.')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      })
      rzp.open()
    } catch (err) {
      handleApiError(err)
      stopLoading()
    }
  }

  async function handlePlaceOrder() {
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    if (!cartData || !shop) return

    setOrderError('')

    const orderEmail = email.trim() || `${phone}@moon-checkout.local`
    const customer = { name: delivery.name, phone, email: orderEmail }
    const shippingAddress = buildShippingAddress(delivery, checkoutSettings)

    try {
      if (paymentMethod === 'cod') {
        setLoading(true)
        setLoadingMessage('Creating your order...')
        const marketing = buildOrderMarketingPayload()
        const result = await createOrder({
          shop,
          cartData,
          customer,
          shippingAddress,
          paymentMethod: 'cod',
          orderTotalPaise: finalTotal,
          cartSubtotalPaise: cartSubtotal,
          marketing,
          funnelSessionId: getFunnelSessionId(),
        })
        if (marketing?.eventId) {
          marketing.payload.order_id = result.orderName
          marketing.payload.transaction_id = result.orderName
        }
        setOrderSuccess(buildOrderSuccessSnapshot(result, 'cod', marketing?.eventId))
        window.parent.postMessage(
          { type: 'MOON_CHECKOUT_ORDER_SUCCESS', orderId: result.orderId, orderName: result.orderName },
          '*'
        )
      } else if (paymentMethod === 'advance') {
        await openRazorpayCheckout({
          amount: advancePayNow,
          description: 'Partial COD — online payment',
          orderPaymentMethod: 'advance',
        })
      } else {
        await openRazorpayCheckout({
          amount: finalTotal,
          description: 'Order Payment',
          orderPaymentMethod: 'online',
        })
      }
    } catch (err) {
      handleApiError(err)
    } finally {
      if (paymentMethod === 'cod') {
        stopLoading()
      }
    }
  }



  const headerBranding = resolveShopBranding(cartData, shopBranding)

  if (import.meta.env.DEV) {
    const previewParams = new URLSearchParams(window.location.search)
    if (previewParams.get('preview') === 'success') {
      const previewPayment = previewParams.get('payment') || 'online'
      const previewOrder = getOrderSuccessPreview(previewPayment)
      const previewBranding = resolveShopBranding(previewOrder.cartData, shopBranding)
      return (
        <OrderSuccessPage
          order={previewOrder}
          shopName={previewBranding.shopName}
          shopLogoUrl={previewBranding.shopLogoUrl}
        />
      )
    }
  }

  if (orderSuccess) {
    const successBranding = resolveShopBranding(orderSuccess.cartData, shopBranding)
    return (
      <OrderSuccessPage
        order={orderSuccess}
        shopName={successBranding.shopName}
        shopLogoUrl={successBranding.shopLogoUrl}
      />
    )
  }



  if (!cartData || cartLoading || configLoading) {
    return (
      <Loader message="Preparing your cart checkout" />
    )
  }

  if (!checkoutSettings.checkoutEnabled) {
    return (
      <div className="checkout-page">
        <CheckoutHeader
          showBackArrow
          onBackClick={() => window.parent.postMessage({ type: 'MOON_CHECKOUT_CLOSE' }, '*')}
          shopName={headerBranding.shopName}
          shopLogoUrl={headerBranding.shopLogoUrl}
        />
        <div className="checkout-section">
          <OrderErrorBanner
            message="Checkout is temporarily unavailable for this store. Please try again later."
            onDismiss={() => window.parent.postMessage({ type: 'MOON_CHECKOUT_CLOSE' }, '*')}
          />
        </div>
      </div>
    )
  }

  const sharedCheckoutProps = {
    cartData,
    shopName: headerBranding.shopName,
    shopLogoUrl: headerBranding.shopLogoUrl,
    phone,
    email,
    delivery,
    paymentMethod,
    errors,
    checkoutSettings: effectiveCheckoutSettings,
    rtoContext,
    orderError,
    toast,
    finalTotal,
    advancePayNow,
    loading,
    loadingMessage,
    onPhoneChange: (v) => { setPhone(v); setErrors((p) => ({ ...p, phone: '' })) },
    onEmailChange: (v) => { setEmail(v); setErrors((p) => ({ ...p, email: '' })) },
    onDeliveryChange: handleDeliveryChange,
    onPaymentMethodChange: setPaymentMethod,
    onPlaceOrder: handlePlaceOrder,
    onDismissError: () => setOrderError(''),
    onDismissToast: () => setToast(null),
    onCheckoutClose: trackCheckoutAbandon,
  }

  return (
    <>
      {loading && (
        <Loader
          message={loadingMessage || 'Placing your order...'}
          submessage={
            loadingMessage.includes('Verifying') || loadingMessage.includes('Creating')
              ? "Please don't close this window while we confirm your order."
              : undefined
          }
          overlay
        />
      )}

      {isThreeStep ? (
        <ThreeStepCheckout
          {...sharedCheckoutProps}
          currentStep={currentStep}
          onBack={handleStepBack}
          onContinue={handleStepContinue}
        />
      ) : (
        <SinglePageCheckout {...sharedCheckoutProps} />
      )}
    </>
  )

}

