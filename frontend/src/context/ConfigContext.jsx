import React, { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../api/client'

const ConfigContext = createContext(null)

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const data = await api.config.get()
      setConfig(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Helper functions
  const formatCurrency = (amount) => {
    if (!config) return amount
    
    const { currencyDisplay } = config.ui
    const formatted = new Intl.NumberFormat(
      currencyDisplay.format === 'indian' ? 'en-IN' : 'en-US',
      { maximumFractionDigits: currencyDisplay.decimalPlaces }
    ).format(amount)
    
    return currencyDisplay.symbolPosition === 'before'
      ? `${currencyDisplay.symbol}${formatted}`
      : `${formatted}${currencyDisplay.symbol}`
  }

  const formatDate = (date) => {
    if (!config) return date || '-'
    if (!date) return '-'
    
    const d = new Date(date)
    // Check if date is valid
    if (isNaN(d.getTime())) return '-'
    
    const format = config.ui.dateDisplay.format
    
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    
    return format.replace('DD', day).replace('MM', month).replace('YYYY', year)
  }

  const value = {
    config,
    loading,
    error,
    
    // Society
    society: config?.society,
    societyName: config?.society?.name,
    
    // Fees
    fees: config?.fees,
    
    // Loan
    loanConfig: config?.loan,
    tenurePresets: config?.loan?.tenure?.presets || [],
    
    // Savings
    savingsConfig: config?.savings,
    
    // Member
    memberConfig: config?.member,
    requiredDocuments: config?.member?.documents?.required || [],
    
    // UI
    theme: config?.ui?.theme,
    navigation: (config?.ui?.navigation || []).filter(n => n.enabled),
    dashboardWidgets: (config?.ui?.dashboard?.widgets || []).filter(w => w.enabled),
    
    // Helpers
    formatCurrency,
    formatDate,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Configuration Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  )
}

export function useConfig() {
  const context = useContext(ConfigContext)
  if (!context) {
    throw new Error('useConfig must be used within ConfigProvider')
  }
  return context
}