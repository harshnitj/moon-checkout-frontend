import axios from 'axios'

const DEFAULT_BACKEND_URL = 'https://moon-checkout-backend.vercel.app'

// Dev: leave unset to use Vite proxy (/api → localhost:3000). Prod: talk to deployed backend.
const BASE =
  import.meta.env.VITE_BACKEND_URL ||
  (import.meta.env.DEV ? '' : DEFAULT_BACKEND_URL)

const http = axios.create({
  baseURL: BASE,
})

export function getApiBase() {
  return BASE
}

export default http
