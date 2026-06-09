import http from './http'

export async function createOrder({ shop, cartData, customer, shippingAddress, paymentMethod, orderTotalPaise, cartSubtotalPaise }) {
  const lineItems = cartData.items.map((item) => ({
    variant_id: item.variantId,
    quantity: item.quantity,
  }))

  const res = await http.post('/api/orders/create', {
    shop,
    lineItems,
    customer,
    shippingAddress,
    paymentMethod,
    orderTotalPaise,
    cartSubtotalPaise,
  })

  return res.data
}

export async function createRazorpayOrder({ shop, amount }) {
  const res = await http.post('/api/payments/razorpay/create-order', {
    shop,
    amount,
  })
  return res.data
}

export async function verifyRazorpayPayment({ shop, razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  const res = await http.post('/api/payments/razorpay/verify', {
    shop,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  })
  return res.data
}
