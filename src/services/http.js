import axios from 'axios'

// Use VITE_BACKEND_URL when set (backend tunnel URL). Leave empty to use Vite proxy in dev.
const BASE = import.meta.env.VITE_BACKEND_URL || ''

const http = axios.create({
  baseURL: BASE,
})

export function getApiBase() {
  return BASE
}

export default http
