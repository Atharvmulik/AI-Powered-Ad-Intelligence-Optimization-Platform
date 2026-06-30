// ============================================================
// src/lib/api.ts
// Axios instance used throughout the application.
// ============================================================

import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

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

    return Promise.reject(new Error(message))
  }
)

export default api