// Uses api.postalpincode.in — free, no API key required
export async function lookupPincode(pincode) {
  if (!pincode || pincode.length !== 6) return null

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`)
    const data = await res.json()

    if (
      data &&
      data[0] &&
      data[0].Status === 'Success' &&
      data[0].PostOffice &&
      data[0].PostOffice.length > 0
    ) {
      const po = data[0].PostOffice[0]
      return {
        city: po.District,
        state: po.State,
        postOfficeName: po.Name,
      }
    }
    return null
  } catch (err) {
    console.error('Pincode lookup failed:', err)
    return null
  }
}
