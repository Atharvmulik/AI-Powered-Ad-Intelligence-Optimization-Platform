// ============================================================
// src/lib/api.ts
// ============================================================

import axios from 'axios'

const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_URL as string | undefined,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
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