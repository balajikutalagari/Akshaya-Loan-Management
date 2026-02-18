import { configService } from '../services/configService.js'
import { InterestEngine } from './interestEngine.js'

class ScheduleEngine {
  constructor() {
    this.interestEngine = new InterestEngine()
    this.loanConfig = configService.getLoanConfig()
    this.savingsConfig = configService.getSavingsConfig()
  }

  /**
   * Generate complete EMI schedule
   */
  generateSchedule(params) {
    const {
      loanAmount,
      tenureMonths,
      disbursementDate,
      dueDate = this.loanConfig.emi.defaultDueDate,
      savingsAmount = this.savingsConfig.defaultAmount || 200, // Use config default or 200
    } = params

    const schedule = []
    const monthlyPrincipal = Math.round(loanAmount / tenureMonths)
    let outstandingBalance = loanAmount
    let currentDate = new Date(disbursementDate)
    
    // Extract day from dueDate if it's a date string, otherwise use as day number
    let dueDateDay = dueDate
    if (typeof dueDate === 'string' && dueDate.includes('-')) {
      dueDateDay = new Date(dueDate).getDate()
    } else if (!dueDate) {
      // Default to a reasonable day if no dueDate is provided
      dueDateDay = this.loanConfig.emi.defaultDueDate || 3
    }
    
    // Set to next month's due date
    currentDate.setMonth(currentDate.getMonth() + 1)
    currentDate.setDate(dueDateDay)

    for (let i = 1; i <= tenureMonths; i++) {
      // Calculate interest on outstanding balance
      const monthlyInterest = this.interestEngine.calculateMonthlyInterest(
        outstandingBalance, 
        loanAmount
      )
      
      // Principal payment is fixed
      const principalPayment = i === tenureMonths ? outstandingBalance : monthlyPrincipal
      const closingBalance = Math.max(0, outstandingBalance - principalPayment)
      
      // Calculate total payment: Principal + Interest + Savings
      let totalPayment = principalPayment + monthlyInterest + savingsAmount

      schedule.push({
        emiNumber: i,
        dueDate: currentDate.toISOString().split('T')[0],
        openingBalance: outstandingBalance,
        monthlyInterest,
        monthlyPrincipal: principalPayment,
        closingBalance,
        monthlySavings: savingsAmount,
        totalPayment,
        paymentStatus: 'pending',
      })

      outstandingBalance = closingBalance
      currentDate.setMonth(currentDate.getMonth() + 1)
    }

    return schedule
  }

  /**
   * Calculate initial collection breakdown
   */
  calculateInitialCollection(loanAmount, isNewMember = true) {
    const fees = configService.getFees()
    const breakdown = {}
    let total = 0

    // Membership fee (only for new members)
    if (isNewMember && fees.membership.mandatory) {
      breakdown.membershipFee = fees.membership.amount
      total += fees.membership.amount
    }

    // Share capital (only for new members)
    if (isNewMember && fees.shareCapital.mandatory) {
      breakdown.shareCapital = fees.shareCapital.amount
      total += fees.shareCapital.amount
    }

    // Processing fee
    const processingFee = configService.getProcessingFee(loanAmount)
    breakdown.processingFee = processingFee
    total += processingFee

    // First month savings
    if (this.savingsConfig.mandatoryWithLoan) {
      breakdown.savings = this.savingsConfig.defaultAmount || 200
      total += breakdown.savings
    }

    breakdown.total = total
    return breakdown
  }

  /**
   * Calculate loan summary
   */
  calculateLoanSummary(schedule) {
    const totalPrincipal = schedule.reduce((sum, emi) => sum + emi.monthlyPrincipal, 0)
    const totalInterest = schedule.reduce((sum, emi) => sum + emi.monthlyInterest, 0)
    const totalSavings = schedule.reduce((sum, emi) => sum + emi.monthlySavings, 0)
    const totalRepayment = totalPrincipal + totalInterest + totalSavings
    const monthlyEMI = schedule.length > 0 ? schedule[0].totalPayment : 0
    
    return {
      totalPrincipal,
      totalInterest,
      totalSavings,
      totalPayable: totalRepayment,
      totalRepayment,
      monthlyEMI,
      emiCount: schedule.length,
    }
  }
}

export { ScheduleEngine }