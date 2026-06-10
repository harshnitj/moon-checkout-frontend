function buildPreviewCart() {
  return {
    shop: 'new-dev-ailovmic.myshopify.com',
    items: [
      {
        variantId: 123456,
        productId: 789012,
        title: 'Pro Runner X1 - Crimson',
        variantTitle: 'UK 9',
        quantity: 1,
        price: 499900,
        compareAtPrice: 599900,
        image: null,
        sku: 'PRX1-CR',
      },
    ],
    itemCount: 1,
    totalPrice: 499900,
    currency: 'INR',
  }
}

export function getOrderSuccessPreview(paymentMethod = 'online') {
  const cartData = buildPreviewCart()
  const orderTotal = cartData.totalPrice

  return {
    orderId: 'gid://shopify/Order/928374102',
    orderName: '#MC-9283',
    cartData,
    delivery: {
      name: 'Priya Sharma',
      city: 'Mumbai',
      pincode: '400001',
      state: 'Maharashtra',
    },
    email: 'priya@example.com',
    phone: '9876543210',
    paymentMethod,
    totalPaid: paymentMethod === 'advance' ? 9900 : orderTotal,
    orderTotal,
  }
}
