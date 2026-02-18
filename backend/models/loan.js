import { BaseModel } from './base.js'
import { ScheduleEngine } from '../engines/scheduleEngine.js'

class LoanModel extends BaseModel {
  constructor(db) {
    super(db)
    this.collection = 'loans'
    this.scheduleEngine = new ScheduleEngine()
  }

  async create(data) {
    // Generate loan ID
    const loanId = await this.generateLoanId()
    
    // Ensure disbursementDate is set
    const disbursementDate = data.disbursementDate || new Date().toISOString().split('T')[0]
    
    // Generate EMI schedule
    const schedule = this.scheduleEngine.generateSchedule({
      loanAmount: data.loanAmount,
      tenureMonths: data.tenureMonths,
      disbursementDate: disbursementDate,
      dueDate: data.dueDate,
      savingsAmount: data.savingsAmount,
    })

    const summary = this.scheduleEngine.calculateLoanSummary(schedule)
    
    const loan = await super.create({
      ...data,
      loanId,
      disbursementDate,
      status: 'active',
      schedule,
      summary,
      outstandingBalance: data.loanAmount,
      nextEmiNumber: 1,
      lateFeeAmount: data.lateFeeAmount || 1000, // Default Rs. 1000 if not specified
    })

    return loan
  }

  async generateLoanId() {
    const sequence = await this.getNextSequence()
    const year = new Date().getFullYear()
    return `LOAN-${year}-${sequence.toString().padStart(5, '0')}`
  }

  async getNextSequence() {
    try {
      const data = await this.db.get('sequences:loan')
      const value = data?.value || data
      const current = JSON.parse(value).value
      await this.db.put('sequences:loan', JSON.stringify({ value: current + 1 }))
      return current + 1
    } catch (error) {
      await this.db.put('sequences:loan', JSON.stringify({ value: 1 }))
      return 1
    }
  }

  async findByMemberId(memberId) {
    const results = []
    
    try {
      const stream = this.db.createReadStream()
      for await (const { key, value } of stream) {
        if (key.startsWith(`${this.collection}:`)) {
          const loan = JSON.parse(value)
          if (loan.memberId === memberId) {
            results.push(loan)
          }
        }
      }
    } catch (error) {
      console.error('Error searching loans by member:', error)
    }
    
    return results
  }

  async getActiveLoans() {
    const results = []
    
    for await (const { key, value } of this.db.createReadStream()) {
      if (key.startsWith(`${this.collection}:`)) {
        const loan = JSON.parse(value)
        if (loan.status === 'active') {
          results.push(loan)
        }
      }
    }
    
    return results
  }

  async getOverdueLoans() {
    const results = []
    const today = new Date().toISOString().split('T')[0]
    
    for await (const { key, value } of this.db.createReadStream()) {
      if (key.startsWith(`${this.collection}:`)) {
        const loan = JSON.parse(value)
        if (loan.status === 'active') {
          // Find overdue EMIs
          const overdueEmis = loan.schedule.filter(emi => 
            emi.paymentStatus === 'pending' && emi.dueDate < today
          )
          
          if (overdueEmis.length > 0) {
            results.push({
              ...loan,
              overdueEmis,
              overdueAmount: overdueEmis.reduce((sum, emi) => sum + emi.totalPayment, 0),
            })
          }
        }
      }
    }
    
    return results
  }

  async getDueToday() {
    const results = []
    const today = new Date().toISOString().split('T')[0]
    
    for await (const { key, value } of this.db.createReadStream()) {
      if (key.startsWith(`${this.collection}:`)) {
        const loan = JSON.parse(value)
        if (loan.status === 'active') {
          const dueEmis = loan.schedule.filter(emi => 
            emi.paymentStatus === 'pending' && emi.dueDate === today
          )
          
          if (dueEmis.length > 0) {
            results.push({
              ...loan,
              dueEmis,
              dueAmount: dueEmis.reduce((sum, emi) => sum + emi.totalPayment, 0),
            })
          }
        }
      }
    }
    
    return results
  }

  async getStats() {
    let totalLoans = 0
    let activeLoans = 0
    let closedLoans = 0
    let totalDisbursed = 0
    let totalOutstanding = 0
    
    try {
      // Check if createReadStream exists and is a function
      if (this.db && typeof this.db.createReadStream === 'function') {
        const stream = this.db.createReadStream()
        for await (const { key, value } of stream) {
          if (key.startsWith(`${this.collection}:`)) {
            const loan = JSON.parse(value)
            totalLoans++
            totalDisbursed += loan.loanAmount || 0
            
            if (loan.status === 'active') {
              activeLoans++
              totalOutstanding += loan.outstandingBalance || 0
            } else {
              closedLoans++
            }
          }
        }
      } else {
        console.log('Database stream not available yet')
      }
    } catch (error) {
      console.log('Error reading loan stats:', error.message)
    }
    
    return {
      totalLoans,
      activeLoans,
      closedLoans,
      totalDisbursed,
      totalOutstanding,
    }
  }
}

export { LoanModel }