import { configService } from './configService.js'
import { ScheduleEngine } from '../engines/scheduleEngine.js'

class LoanService {
  constructor(db) {
    this.db = db
    this.scheduleEngine = new ScheduleEngine()
    this.loanConfig = configService.getLoanConfig()
  }

  async calculateLoan(params) {
    const { loanAmount, tenureMonths, dueDate, savingsAmount } = params
    
    // Validate loan amount
    if (loanAmount < this.loanConfig.minAmount || loanAmount > this.loanConfig.maxAmount) {
      throw new Error(`Loan amount must be between ${this.loanConfig.minAmount} and ${this.loanConfig.maxAmount}`)
    }

    // Generate schedule
    const schedule = this.scheduleEngine.generateSchedule({
      loanAmount,
      tenureMonths,
      disbursementDate: new Date().toISOString().split('T')[0],
      dueDate,
      savingsAmount,
    })

    const summary = this.scheduleEngine.calculateLoanSummary(schedule)
    const initialCollection = this.scheduleEngine.calculateInitialCollection(loanAmount, false)

    return {
      schedule,
      summary,
      initialCollection,
      interestRate: configService.getInterestRate(loanAmount),
    }
  }

  async validateEligibility(memberId, loanAmount) {
    const rules = configService.config.rules.eligibility
    const issues = []

    // Skip max active loans check - members can have multiple loans
    // const activeLoans = await this.getActiveLoansByMember(memberId)
    // if (activeLoans.length >= rules.maxActiveLoans) {
    //   issues.push(`Member already has ${activeLoans.length} active loan(s). Maximum allowed: ${rules.maxActiveLoans}`)
    // }

    // Check minimum membership days
    if (rules.minMembershipDays > 0) {
      // This would require member joining date check
      // issues.push('Minimum membership period not met')
    }

    return {
      eligible: issues.length === 0,
      issues,
    }
  }

  async getActiveLoansByMember(memberId) {
    const results = []
    
    for await (const { key, value } of this.db.createReadStream()) {
      if (key.startsWith('loans:')) {
        const loan = JSON.parse(value)
        if (loan.memberId === memberId && loan.status === 'active') {
          results.push(loan)
        }
      }
    }
    
    return results
  }

  async getUpcomingDues(days = 7) {
    const results = []
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + days)
    const endDateStr = endDate.toISOString().split('T')[0]
    
    for await (const { key, value } of this.db.createReadStream()) {
      if (key.startsWith('loans:')) {
        const loan = JSON.parse(value)
        if (loan.status === 'active') {
          const upcomingEmis = loan.schedule.filter(emi => 
            emi.paymentStatus === 'pending' && 
            emi.dueDate <= endDateStr &&
            emi.dueDate >= new Date().toISOString().split('T')[0]
          )
          
          if (upcomingEmis.length > 0) {
            results.push({
              loanId: loan.loanId,
              memberId: loan.memberId,
              memberName: loan.memberName,
              upcomingEmis,
              totalDue: upcomingEmis.reduce((sum, emi) => sum + emi.totalPayment, 0),
            })
          }
        }
      }
    }
    
    return results
  }
}

export { LoanService }