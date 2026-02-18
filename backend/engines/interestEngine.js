import { configService } from '../services/configService.js'

class InterestEngine {
  constructor() {
    this.config = configService.getLoanConfig().interest
  }

  /**
   * Calculate monthly interest based on config
   */
  calculateMonthlyInterest(outstandingBalance, loanAmount) {
    const rate = configService.getInterestRate(loanAmount)
    
    if (this.config.type === 'reducingBalance') {
      return this.reducingBalanceInterest(outstandingBalance, rate)
    } else if (this.config.type === 'flatRate') {
      return this.flatRateInterest(loanAmount, rate)
    }
    
    return this.reducingBalanceInterest(outstandingBalance, rate)
  }

  /**
   * Reducing balance: Interest on current outstanding
   */
  reducingBalanceInterest(outstanding, rate) {
    // If rate is annual, convert to monthly
    const monthlyRate = this.config.rateType === 'annual' ? rate / 12 : rate
    return Math.round(outstanding * monthlyRate / 100)
  }

  /**
   * Flat rate: Interest on original principal
   */
  flatRateInterest(principal, rate) {
    const monthlyRate = this.config.rateType === 'annual' ? rate / 12 : rate
    return Math.round(principal * monthlyRate / 100)
  }

  /**
   * Calculate savings interest
   */
  calculateSavingsInterest(balance) {
    const savingsConfig = configService.getSavingsConfig()
    if (!savingsConfig.interest.enabled) return 0
    
    const rate = configService.getSavingsInterestRate()
    return Math.round(balance * rate / 100)
  }
}

export { InterestEngine }