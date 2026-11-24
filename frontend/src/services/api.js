const API_BASE_URL = '/api'

// Authentication storage
export const auth = {
  getToken: () => sessionStorage.getItem('access_token'),

  getUser: () => {
    const user = sessionStorage.getItem('employee')

    return user ? JSON.parse(user) : null
  },

  save: (loginData) => {
    sessionStorage.setItem('access_token', loginData.access_token)
    sessionStorage.setItem(
      'employee',
      JSON.stringify(loginData.employee)
    )
  },

  logout: () => {
    sessionStorage.removeItem('access_token')
    sessionStorage.removeItem('employee')
  },

  isLoggedIn: () => !!sessionStorage.getItem('access_token'),
}


// Main API request function
async function apiRequest(endpoint, options = {}) {
  const token = auth.getToken()

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // Automatically attach JWT token
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)

    throw new Error(
      errorData?.detail || `API request failed: ${response.status}`
    )
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}


// API methods
export const api = {
  get: (endpoint) => apiRequest(endpoint),

  post: (endpoint, data) =>
    apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  put: (endpoint, data) =>
    apiRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (endpoint) =>
    apiRequest(endpoint, {
      method: 'DELETE',
    }),
}