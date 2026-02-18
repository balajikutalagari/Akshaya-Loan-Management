/**
 * API Configuration for different environments
 */
export const getApiBaseUrl = () => {
  // Check if we're in production (deployed backend)
  if (process.env.NODE_ENV === 'production' && process.env.VITE_API_URL) {
    return process.env.VITE_API_URL
  }
  
  // Default to localhost for development and Pear app
  return 'http://localhost:3001/api'
}

export const API_BASE_URL = getApiBaseUrl()