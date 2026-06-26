// ============================================================
// src/lib/api.ts
// ============================================================

import axios from 'axios'

console.log(
  'API URL =',
  (import.meta as any).env?.VITE_API_BASE_URL
)

const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_BASE_URL as string | undefined,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    const message =
      error?.response?.data?.detail ||
      error?.message ||
      'An unexpected error occurred'
    return Promise.reject(new Error(message))
  }
)

export default api