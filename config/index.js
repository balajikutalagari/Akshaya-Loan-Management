import config from './society.config.js'

/**
 * Configuration Service
 * 
 * Central service for accessing society configuration
 */
class ConfigService {
  constructor() {
    this.config = config
    this.validateConfig()
  }

  validateConfig() {
    // Validate required fields exist
    const required = ['society', 'fees', 'loan', 'payment', 'member']
    for (const key of required) {
      if (!this.config[key]) {
        throw new Error(`Missing required config section: ${key}`)
      }
    }
  }

  // Society
  getSociety() {
    return this.config.society
  }

  getSocietyName() {
    return this.config.society.name
  }

  // Fees
  getFees() {
    return this.config.fees
  }

  getMembershipFee() {
    return this.config.fees.membership.amount
  }

  getShareCapital() {
    return this.config.fees.shareCapital.amount
  }

  getProcessingFee(loanAmount) {
    const fee = this.config.fees.processingFee
    if (fee.type === 'percentage') {
      let amount = Math.round(loanAmount * fee.value / 100)
      if (fee.minAmount) amount = Math.max(amount, fee.minAmount)
      if (fee.maxAmount) amount = Math.min(amount, fee.maxAmount)
      return amount
    }
    return fee.value
  }

  getLateFee() {
    return this.config.fees.lateFee.value
  }

  // Loan
  getLoanConfig() {
    return this.config.loan
  }

  getInterestRate(loanAmount) {
    const { interest } = this.config.loan
    
    // Check slabs first
    if (interest.slabs && interest.slabs.length > 0) {
      for (const slab of interest.slabs) {
        if (loanAmount >= slab.minAmount && 
            (slab.maxAmount === null || loanAmount <= slab.maxAmount)) {
          return slab.rate
        }
      }
    }
    
    return interest.defaultRate
  }

  getTenurePresets() {
    return this.config.loan.tenure.presets
  }

  // Savings
  getSavingsConfig() {
    return this.config.savings
  }

  getSavingsInterestRate() {
    if (!this.config.savings.interest.enabled) return 0
    
    const annual = this.config.savings.interest.ratePerAnnum
    const freq = this.config.savings.interest.calculationFrequency
    
    switch (freq) {
      case 'monthly': return annual / 12
      case 'quarterly': return annual / 4
      case 'yearly': return annual
      default: return annual / 12
    }
  }

  // Member
  getMemberConfig() {
    return this.config.member
  }

  getRequiredDocuments() {
    return this.config.member.documents.required
  }

  // UI
  getUIConfig() {
    return this.config.ui
  }

  getTheme() {
    return this.config.ui.theme
  }

  getNavigation() {
    return this.config.ui.navigation.filter(nav => nav.enabled)
  }

  // Validation
  getValidationRules() {
    return this.config.validation
  }

  // Templates
  getReceiptTemplate() {
    return this.config.templates.receipt
  }

  getReminderTemplate(type, channel = 'whatsapp') {
    return this.config.reminders.channels[channel]?.templates[type]
  }

  // Currency formatting
  formatCurrency(amount) {
    const { currencyDisplay } = this.config.ui
    
    // Indian format: 12,34,567
    if (currencyDisplay.format === 'indian') {
      const formatted = new Intl.NumberFormat('en-IN', {
        maximumFractionDigits: currencyDisplay.decimalPlaces,
        minimumFractionDigits: currencyDisplay.decimalPlaces,
      }).format(amount)
      
      return currencyDisplay.symbolPosition === 'before'
        ? `${currencyDisplay.symbol}${formatted}`
        : `${formatted}${currencyDisplay.symbol}`
    }
    
    // International format
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.config.society.currency,
      maximumFractionDigits: currencyDisplay.decimalPlaces,
    }).format(amount)
  }

  // Date formatting
  formatDate(date) {
    const d = new Date(date)
    const format = this.config.ui.dateDisplay.format
    
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    
    return format
      .replace('DD', day)
      .replace('MM', month)
      .replace('YYYY', year)
  }

  // Get full config (for frontend)
  getFullConfig() {
    return this.config
  }
}

// Singleton
const configService = new ConfigService()
export { configService, ConfigService }