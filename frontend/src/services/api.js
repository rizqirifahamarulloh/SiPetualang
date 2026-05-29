// frontend/src/services/api.js
import axios from 'axios'

// API Base URL configuration
// Priority: VITE_API_BASE_URL env var > auto-detect production > localhost fallback
const PRODUCTION_API = 'https://sipetualang-rental.up.railway.app';
const LOCAL_API = 'http://localhost:8000';

export const BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? PRODUCTION_API : LOCAL_API);
export const API_URL = `${BASE_URL}/api`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - Add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const token = localStorage.getItem('token')
        if (token) {
          const response = await axios.post(
            `${API_URL}/refresh`,
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )

          const { token: newToken } = response.data
          localStorage.setItem('token', newToken)

          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        // Refresh failed - logout
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api