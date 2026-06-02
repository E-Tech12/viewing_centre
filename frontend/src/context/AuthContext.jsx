import { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      authApi.me()
        .then(({ data }) => setUser(data))
        .catch(() => { localStorage.clear() })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const { data } = await authApi.login({ email, password })
    localStorage.setItem('access_token',  data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    setUser(data.user)
    return data.user
  }

  const register = async (payload) => {
    const { data } = await authApi.register(payload)
    localStorage.setItem('access_token',  data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    setUser(data.user)
    return data.user
  }

  const logout = () => { localStorage.clear(); setUser(null) }

  const isUser         = user?.role === 'user'
  const isEventOwner   = user?.role === 'event_owner'
  const isPlatformAdmin= user?.role === 'platform_admin'
  const isStaff        = isEventOwner || isPlatformAdmin

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, logout, setUser,
      isUser, isEventOwner, isPlatformAdmin, isStaff,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
