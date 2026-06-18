/* eslint-disable react-refresh/only-export-components */
import { createContext, useState } from 'react'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('adai_auth') === 'true'
  })
  
  const [user, setUser] = useState(() => {
    const isAuth = localStorage.getItem('adai_auth') === 'true'
    return isAuth ? {
      email: 'demo@adai.in',
      name: 'Demo Account',
      role: 'Administrator'
    } : null
  })

  const login = (email, password) => {
    localStorage.setItem('adai_auth', 'true')
    setIsAuthenticated(true)
    setUser({
      email: email || 'demo@adai.in',
      name: 'Demo Account',
      role: 'Administrator'
    })
    // Avoid unused warning for password if it exists
    if (password) {
      // Just a mock validation step
    }
    return true
  }

  const logout = () => {
    localStorage.removeItem('adai_auth')
    setIsAuthenticated(false)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
