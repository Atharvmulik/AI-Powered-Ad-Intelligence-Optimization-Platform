// ============================================================
// src/lib/api.ts
// Axios instance used throughout the application.
// ============================================================

import axios from 'axios'

const API_URL = import.meta.env.VITE_API_BASE_URL

console.log('API URL =', API_URL)

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.detail ??
      error?.message ??
      'An unexpected error occurred'

    const normalizedError = new Error(message) as Error & { status?: number }
    normalizedError.status = error?.response?.status
    return Promise.reject(normalizedError)
  }
)

export default api