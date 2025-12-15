// Centralized error handling utility
export const handleApiError = (error, response = null) => {
    console.error('API Error:', error)
    
    // Network errors (no response)
    if (!response) {
      if (error.name === 'AbortError') {
        return 'Request was cancelled'
      }
      if (error.message.includes('fetch')) {
        return 'Network error. Please check your internet connection and try again.'
      }
      return 'An unexpected error occurred. Please try again.'
    }
    
    // HTTP status code errors
    switch (response.status) {
      case 400:
        return 'Invalid request. Please check your input and try again.'
      case 401:
        return 'Authentication failed. Please log in again.'
      case 403:
        return 'Access denied. You don\'t have permission to perform this action.'
      case 404:
        return 'Resource not found. The requested item may have been deleted.'
      case 409:
        return 'Conflict detected. This item may already exist.'
      case 422:
        return 'Validation failed. Please check your input data.'
      case 429:
        return 'Too many requests. Please wait a moment and try again.'
      case 500:
        return 'Server error. Please try again later.'
      case 502:
      case 503:
      case 504:
        return 'Service temporarily unavailable. Please try again later.'
      default:
        return 'An unexpected error occurred. Please try again.'
    }
  }
  
  // Extract error message from API response
  export const getErrorMessage = (data) => {
    if (typeof data.error === 'string') {
      return data.error
    }
    if (data.message) {
      return data.message
    }
    if (data.errors && Array.isArray(data.errors)) {
      return data.errors.join(', ')
    }
    return 'An error occurred while processing your request.'
  }
  
  // Validate API response structure
  export const validateApiResponse = (data) => {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format')
    }
    
    if (data.success === false && !data.error && !data.message) {
      throw new Error('API returned error without message')
    }
    if (data.success === false && data.error) {
    throw new Error(data.error.message);
  }
    
    return true
  }
  