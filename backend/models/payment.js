import { BaseModel } from './base.js'
import { configService } from '../services/configService.js'

class PaymentModel extends BaseModel {
  constructor(db) {
    super(db)
    this.collection = 'payments'
    this.config = configService.config
  }

  async create(data) {
    // Generate payment ID
    const paymentId = await this.generatePaymentId()
    
    const payment = await super.create({
      ...data,
      paymentId,
      status: 'completed', // Default status
      processedDate: new Date().toISOString(),
    })

    return payment
  }

  async generatePaymentId() {
    // Get next sequence number
    const sequence = await this.getNextSequence()
    const paddedSequence = sequence.toString().padStart(6, '0')
    return `PAY-${paddedSequence}`
  }

  async getNextSequence() {
    try {
      const data = await this.db.get('sequences:payment')
      const current = JSON.parse(data).value
      await this.db.put('sequences:payment', JSON.stringify({ value: current + 1 }))
      return current + 1
    } catch (error) {
      // First payment
      await this.db.put('sequences:payment', JSON.stringify({ value: 1 }))
      return 1
    }
  }

  async findByMember(memberId) {
    const results = []
    
    try {
      const stream = this.db.createReadStream()
      for await (const { key, value } of stream) {
        if (key.startsWith(`${this.collection}:`)) {
          const payment = JSON.parse(value)
          if (payment.memberId === memberId) {
            results.push(payment)
          }
        }
      }
    } catch (error) {
      console.error('Error searching payments by member:', error)
    }
    
    return results.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
  }

  async findByLoan(loanId) {
    const results = []
    
    try {
      const stream = this.db.createReadStream()
      for await (const { key, value } of stream) {
        if (key.startsWith(`${this.collection}:`)) {
          const payment = JSON.parse(value)
          if (payment.loanId === loanId) {
            results.push(payment)
          }
        }
      }
    } catch (error) {
      console.error('Error searching payments by loan:', error)
    }
    
    return results.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
  }

  async getStats() {
    let totalCollected = 0
    let paymentsToday = 0
    let paymentsThisMonth = 0
    
    const today = new Date().toISOString().split('T')[0]
    const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
    
    try {
      const stream = this.db.createReadStream()
      for await (const { key, value } of stream) {
        if (key.startsWith(`${this.collection}:`)) {
          const payment = JSON.parse(value)
          if (payment.status === 'completed') {
            totalCollected += payment.amount
            
            if (payment.paymentDate === today) {
              paymentsToday++
            }
            
            if (payment.paymentDate >= thisMonthStart) {
              paymentsThisMonth++
            }
          }
        }
      }
    } catch (error) {
      console.error('Error calculating payment stats:', error)
    }
    
    return {
      totalCollected,
      paymentsToday,
      paymentsThisMonth,
    }
  }

  async getPaymentsByDateRange(fromDate, toDate) {
    const results = []
    
    try {
      const stream = this.db.createReadStream()
      for await (const { key, value } of stream) {
        if (key.startsWith(`${this.collection}:`)) {
          const payment = JSON.parse(value)
          if (payment.paymentDate >= fromDate && payment.paymentDate <= toDate) {
            results.push(payment)
          }
        }
      }
    } catch (error) {
      console.error('Error getting payments by date range:', error)
    }
    
    return results.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
  }

  async getTodayCollection() {
    let todayCollection = 0
    const today = new Date().toISOString().split('T')[0]
    
    try {
      const stream = this.db.createReadStream()
      for await (const { key, value } of stream) {
        if (key.startsWith(`${this.collection}:`)) {
          const payment = JSON.parse(value)
          if (payment.status === 'completed' && payment.paymentDate === today) {
            todayCollection += payment.amount || 0
          }
        }
      }
    } catch (error) {
      console.error('Error calculating today collection:', error)
    }
    
    return todayCollection
  }

  async getRecentTransactions(limit = 10) {
    const results = []
    
    try {
      const stream = this.db.createReadStream()
      for await (const { key, value } of stream) {
        if (key.startsWith(`${this.collection}:`)) {
          const payment = JSON.parse(value)
          results.push(payment)
        }
      }
    } catch (error) {
      console.error('Error getting recent transactions:', error)
    }
    
    return results
      .sort((a, b) => new Date(b.processedDate || b.paymentDate) - new Date(a.processedDate || a.paymentDate))
      .slice(0, limit)
  }
}

export { PaymentModel }