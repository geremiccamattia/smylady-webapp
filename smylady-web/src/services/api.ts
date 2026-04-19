import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { CONFIG, STORAGE_KEYS } from '@/lib/constants'

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: CONFIG.API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEYS.TOKEN)
      localStorage.removeItem(STORAGE_KEYS.USER)
      const publicPaths = ['/explore', '/login', '/register', '/event/', '/user/', '/feed', '/post/']
      const isPublicPath = publicPaths.some(path =>
        window.location.pathname.startsWith(path)
      )
      if (!isPublicPath) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export { apiClient }
