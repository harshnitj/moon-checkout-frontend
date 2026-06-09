import React, { useState, useCallback, useEffect } from 'react'

import './styles/global.css'

import './styles/checkout.css'

import { useCartBridge } from './hooks/useCartBridge'

import { createOrder, createRazorpayOrder, verifyRazorpayPayment } from './services/api'
import { fetchCheckoutConfig } from './services/checkoutConfig'

import CartSummary from './components/CartSummary'

import ContactForm from './components/ContactForm'

import DeliveryForm from './components/DeliveryForm'

import PaymentMethod from './components/PaymentMethod'

import BillDetails from './components/BillDetails'

import StickyFooter from './components/StickyFooter'

import CheckoutHeader from './components/CheckoutHeader'

import Loader from './components/Loader'
import OrderErrorBanner from './components/OrderErrorBanner'
import Toast from './components/Toast'
import { DEFAULT_CHECKOUT_SETTINGS, formatPrice, getAvailablePaymentMethods, getPaymentBreakdown } from './utils/payment'
import { parseApiError } from './utils/parseApiError'
import { buildShippingAddress, validateCheckoutForm } from './utils/formValidation'



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

  const [orderError, setOrderError] = useState('')
  const [toast, setToast] = useState('')

  const [orderSuccess, setOrderSuccess] = useState(null)
  const [checkoutSettings, setCheckoutSettings] = useState(DEFAULT_CHECKOUT_SETTINGS)
  const [configLoading, setConfigLoading] = useState(false)

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
      .then((settings) => {
        setCheckoutSettings(settings)
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
    if (!cartData) return
    const available = getAvailablePaymentMethods(cartData, checkoutSettings)
    if (!available.includes(paymentMethod)) {
      setPaymentMethod(available[0] || 'cod')
    }
  }, [cartData, checkoutSettings, paymentMethod])

  const handleDeliveryChange = useCallback((key, value) => {

    setDelivery((prev) => ({ ...prev, [key]: value }))

    setErrors((prev) => ({ ...prev, [key]: '' }))

  }, [])



  function validate() {
    const newErrors = validateCheckoutForm({ email, phone, delivery }, checkoutSettings)
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }



  const paymentBreakdown = getPaymentBreakdown(cartData, paymentMethod, checkoutSettings)
  const { finalTotal, advancePayNow, cartSubtotal, codCharge } = paymentBreakdown

  useEffect(() => {
    if (!cartData) return
    const isCodPayment = paymentMethod === 'cod' || paymentMethod === 'advance'
    if (isCodPayment && codCharge > 0) {
      setToast(`COD charge of ${formatPrice(codCharge)} has been applied to your order`)
    } else {
      setToast('')
    }
  }, [paymentMethod, codCharge, cartData])



  async function handlePlaceOrder() {

    if (!validate()) {

      window.scrollTo({ top: 0, behavior: 'smooth' })

      return

    }



    if (!cartData || !shop) return

    setOrderError('')
    setLoading(true)



    const orderEmail = email.trim() || `${phone}@moon-checkout.local`
    const customer = { name: delivery.name, phone, email: orderEmail }
    const shippingAddress = buildShippingAddress(delivery, checkoutSettings)



    try {

      if (paymentMethod === 'cod') {
        const result = await createOrder({
          shop,
          cartData,
          customer,
          shippingAddress,
          paymentMethod: 'cod',
          orderTotalPaise: finalTotal,
          cartSubtotalPaise: cartSubtotal,
        })
        setOrderSuccess(result)
        window.parent.postMessage(
          { type: 'MOON_CHECKOUT_ORDER_SUCCESS', orderId: result.orderId, orderName: result.orderName },
          '*'
        )
      } else if (paymentMethod === 'advance') {
        const rzpOrder = await createRazorpayOrder({ shop, amount: advancePayNow })
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: advancePayNow,
          currency: 'INR',
          name: 'Moon Checkout',
          description: 'Partial COD — online payment',
          order_id: rzpOrder.id,
          prefill: { name: delivery.name, email, contact: phone },
          theme: { color: '#008060' },
          handler: async function (response) {
            try {
              await verifyRazorpayPayment({
                shop,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              })
              const result = await createOrder({
                shop,
                cartData,
                customer,
                shippingAddress,
                paymentMethod: 'advance',
                orderTotalPaise: finalTotal,
                cartSubtotalPaise: cartSubtotal,
              })
              setOrderSuccess(result)
              window.parent.postMessage(
                { type: 'MOON_CHECKOUT_ORDER_SUCCESS', orderId: result.orderId, orderName: result.orderName },
                '*'
              )
            } catch (err) {
              handleApiError(err)
            } finally {
              setLoading(false)
            }
          },
        }
        const rzp = new window.Razorpay(options)
        rzp.open()
      } else {
        const rzpOrder = await createRazorpayOrder({ shop, amount: finalTotal })



        const options = {

          key: import.meta.env.VITE_RAZORPAY_KEY_ID,

          amount: finalTotal,

          currency: 'INR',

          name: 'Moon Checkout',

          description: 'Order Payment',

          order_id: rzpOrder.id,

          prefill: {

            name: delivery.name,

            email,

            contact: phone,

          },

          theme: { color: '#008060' },

          handler: async function (response) {
            try {
              await verifyRazorpayPayment({
                shop,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              })
              const result = await createOrder({
                shop,
                cartData,
                customer,
                shippingAddress,
                paymentMethod: 'online',
                orderTotalPaise: finalTotal,
                cartSubtotalPaise: cartSubtotal,
              })
              setOrderSuccess(result)
              window.parent.postMessage(
                { type: 'MOON_CHECKOUT_ORDER_SUCCESS', orderId: result.orderId, orderName: result.orderName },
                '*'
              )
            } catch (err) {
              handleApiError(err)
            } finally {
              setLoading(false)
            }
          },

        }



        const rzp = new window.Razorpay(options)

        rzp.open()

      }

    } catch (err) {
      handleApiError(err)
    } finally {

      setLoading(false)

    }

  }



  if (orderSuccess) {

    return (

      <div className="checkout-page">

        <CheckoutHeader />

        <div style={{

          display: 'flex',

          flexDirection: 'column',

          alignItems: 'center',

          justifyContent: 'center',

          padding: 24,

          textAlign: 'center',

          gap: 12,

          minHeight: 'calc(100vh - 57px)',

        }}>

          <div style={{

            width: 64, height: 64, borderRadius: '50%',

            background: '#e8f7f1', display: 'flex', alignItems: 'center',

            justifyContent: 'center', fontSize: 28, color: '#008060',

          }}>✓</div>

          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Order Created</h1>

          <div style={{

            background: '#f5f5f5', borderRadius: 10,

            padding: '14px 20px', width: '100%', maxWidth: 280,

          }}>

            <p style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>Order Number</p>

            <p style={{ fontSize: 18, fontWeight: 700 }}>{orderSuccess.orderName}</p>

            <p style={{ color: '#888', fontSize: 12, marginTop: 10, marginBottom: 4 }}>Order ID</p>

            <p style={{ fontSize: 15, fontWeight: 600 }}>{orderSuccess.orderId}</p>

          </div>

          <button

            type="button"

            onClick={() => window.parent.postMessage({ type: 'MOON_CHECKOUT_CLOSE' }, '*')}

            className="checkout-footer__btn"

            style={{ width: '100%', maxWidth: 280, marginTop: 8 }}

          >

            Continue Shopping

          </button>

        </div>

      </div>

    )

  }



  if (!cartData || cartLoading || configLoading) {
    return (
      <Loader
        message={
          configLoading
            ? 'Loading checkout settings...'
            : cartLoading
              ? 'Loading your cart...'
              : 'Loading your cart...'
        }
      />
    )
  }

  if (!checkoutSettings.checkoutEnabled) {
    return (
      <div className="checkout-page">
        <CheckoutHeader />
        <div className="checkout-section">
          <OrderErrorBanner
            message="Checkout is temporarily unavailable for this store. Please try again later."
            onDismiss={() => window.parent.postMessage({ type: 'MOON_CHECKOUT_CLOSE' }, '*')}
          />
        </div>
      </div>
    )
  }

  return (

    <div className="checkout-page">

      {loading && <Loader message="Placing your order..." overlay />}

      <CheckoutHeader />

      <OrderErrorBanner message={orderError} onDismiss={() => setOrderError('')} />

      <CartSummary cartData={cartData} />

      <ContactForm
        phone={phone}
        email={email}
        onPhoneChange={(v) => { setPhone(v); setErrors((p) => ({ ...p, phone: '' })) }}
        onEmailChange={(v) => { setEmail(v); setErrors((p) => ({ ...p, email: '' })) }}
        phoneError={errors.phone}
        emailError={errors.email}
        settings={checkoutSettings}
      />

      <DeliveryForm
        delivery={delivery}
        onChange={handleDeliveryChange}
        errors={errors}
        settings={checkoutSettings}
      />

      <PaymentMethod
        selected={paymentMethod}
        onChange={setPaymentMethod}
        cartData={cartData}
        settings={checkoutSettings}
      />

      <BillDetails cartData={cartData} paymentMethod={paymentMethod} settings={checkoutSettings} />

      <StickyFooter
        total={finalTotal}
        onPlaceOrder={handlePlaceOrder}
        loading={loading}
        paymentMethod={paymentMethod}
        advancePayNow={advancePayNow}
      />

      <Toast message={toast} onDismiss={() => setToast('')} />

    </div>

  )

}

