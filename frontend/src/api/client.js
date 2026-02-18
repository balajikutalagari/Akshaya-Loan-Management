/**
 * API Client for communicating with backend
 */
import { API_BASE_URL } from './config'

class ApiClient {
  constructor() {
    // Use configured base URL (can be Vercel or localhost)
    this.baseUrl = API_BASE_URL
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body)
    }

    const response = await fetch(url, config)

    if (!response.ok) {
      const error = await response.text()
      throw new Error(error || `HTTP ${response.status}`)
    }

    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return response.json()
    }

    return response.text()
  }

  // Config
  config = {
    get: () => this.request('/config'),
  }

  // Members
  members = {
    list: (params = {}) => this.request(`/members?${new URLSearchParams(params)}`),
    get: (id) => this.request(`/members/${id}`),
    create: (data) => this.request('/members', { method: 'POST', body: data }),
    update: (id, data) => this.request(`/members/${id}`, { method: 'PUT', body: data }),
    delete: (id) => this.request(`/members/${id}`, { method: 'DELETE' }),
    search: (query) => this.request(`/members/search?q=${encodeURIComponent(query)}`),
    stats: () => this.request('/members/stats'),
  }

  // Loans
  loans = {
    list: (params = {}) => this.request(`/loans?${new URLSearchParams(params)}`),
    get: (id) => this.request(`/loans/${id}`),
    create: (data) => this.request('/loans', { method: 'POST', body: data }),
    update: (id, data) => this.request(`/loans/${id}`, { method: 'PUT', body: data }),
    delete: (id) => this.request(`/loans/${id}`, { method: 'DELETE' }),
    calculate: (params) => this.request('/loans/calculate', { method: 'POST', body: params }),
    eligibility: (memberId, amount) => this.request(`/loans/eligibility/${memberId}?amount=${amount}`),
    overdue: () => this.request('/loans/overdue'),
    dueToday: () => this.request('/loans/due-today'),
    stats: () => this.request('/loans/stats'),
  }

  // Payments
  payments = {
    list: (params = {}) => this.request(`/payments?${new URLSearchParams(params)}`),
    get: (id) => this.request(`/payments/${id}`),
    create: (data) => this.request('/payments', { method: 'POST', body: data }),
    receipt: (id) => this.request(`/payments/${id}/receipt`),
    stats: () => this.request('/payments/stats'),
  }

  // Savings
  savings = {
    list: (params = {}) => this.request(`/savings?${new URLSearchParams(params)}`),
    get: (id) => this.request(`/savings/${id}`),
    byMember: (memberId) => this.request(`/savings/member/${memberId}`),
    interest: (memberId) => this.request(`/savings/interest/${memberId}`),
    stats: () => this.request('/savings/stats'),
  }

  // Reports
  reports = {
    collection: (params) => this.request('/reports/collection', { method: 'POST', body: params }),
    outstanding: (params) => this.request('/reports/outstanding', { method: 'POST', body: params }),
    disbursement: (params) => this.request('/reports/disbursement', { method: 'POST', body: params }),
    overdue: (params) => this.request('/reports/overdue', { method: 'POST', body: params }),
    savings: (params) => this.request('/reports/savings', { method: 'POST', body: params }),
    memberList: (params) => this.request('/reports/member-list', { method: 'POST', body: params }),
    loanList: (params) => this.request('/reports/loan-list', { method: 'POST', body: params }),
    interestIncome: (params) => this.request('/reports/interest-income', { method: 'POST', body: params }),
  }

  // Reminders
  reminders = {
    pending: () => this.request('/reminders/pending'),
    send: (data) => this.request('/reminders/send', { method: 'POST', body: data }),
    history: (params = {}) => this.request(`/reminders/history?${new URLSearchParams(params)}`),
  }

  // Dashboard
  dashboard = {
    stats: () => this.request('/dashboard/stats'),
    upcoming: (days = 7) => this.request(`/dashboard/upcoming?days=${days}`),
    recent: (limit = 10) => this.request(`/dashboard/recent?limit=${limit}`),
  }

  // Documents
  documents = {
    upload: (formData) => this.request('/documents/upload', { 
      method: 'POST', 
      body: formData,
      headers: {} // Let browser set Content-Type with boundary
    }),
    get: (id) => this.request(`/documents/${id}`),
    delete: (id) => this.request(`/documents/${id}`, { method: 'DELETE' }),
  }
}

export const api = new ApiClient()