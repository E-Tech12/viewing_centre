import { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('access_token')

        if (!token) {
          setLoading(false)
          return
        }

        const { data } = await authApi.me()

        setUser(data)
      } catch (error) {
        console.error('Auth restore failed:', error)

        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')

        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = async (email, password) => {
    const { data } = await authApi.login({ email, password })

    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)

    setUser(data.user)

    return data.user
  }

  const register = async (payload) => {
    const { data } = await authApi.register(payload)

    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)

    setUser(data.user)

    return data.user
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')

    setUser(null)

    window.location.href = '/'
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
