import { BaseModel } from './base.js'
import { configService } from '../services/configService.js'

class SavingsModel extends BaseModel {
  constructor(db) {
    super(db)
    this.collection = 'savings'
    this.config = configService.config.savings || { interestRate: 6 }
  }

  async create(data) {
    // Generate savings account ID
    const accountId = await this.generateAccountId()
    
    const savings = await super.create({
      ...data,
      accountId,
      balance: data.initialDeposit || 0,
      interestEarned: 0,
      lastInterestCalculation: new Date().toISOString(),
      status: 'active'
    })

    return savings
  }

  async generateAccountId() {
    // Get next sequence number
    const sequence = await this.getNextSequence()
    const paddedSequence = sequence.toString().padStart(6, '0')
    return `SAV-${paddedSequence}`
  }

  async getNextSequence() {
    try {
      const data = await this.db.get('sequences:savings')
      const current = JSON.parse(data).value
      await this.db.put('sequences:savings', JSON.stringify({ value: current + 1 }))
      return current + 1
    } catch (error) {
      // First savings account
      await this.db.put('sequences:savings', JSON.stringify({ value: 1 }))
      return 1
    }
  }

  async findByMember(memberId) {
    const results = []
    
    try {
      const stream = this.db.createReadStream()
      for await (const { key, value } of stream) {
        if (key.startsWith(`${this.collection}:`)) {
          const savings = JSON.parse(value)
          if (savings.memberId === memberId) {
            results.push(savings)
          }
        }
      }
    } catch (error) {
      console.error('Error searching savings by member:', error)
    }
    
    return results
  }

  async updateBalance(savingsId, amount, transactionType = 'deposit') {
    const savings = await this.findById(savingsId)
    if (!savings) throw new Error('Savings account not found')

    const newBalance = transactionType === 'deposit' 
      ? savings.balance + amount 
      : savings.balance - amount

    if (newBalance < 0) {
      throw new Error('Insufficient balance')
    }

    const updated = await this.update(savingsId, {
      balance: newBalance,
      lastTransactionDate: new Date().toISOString(),
      lastTransactionAmount: amount,
      lastTransactionType: transactionType
    })

    return updated
  }

  async calculateInterest(savingsId) {
    const savings = await this.findById(savingsId)
    if (!savings) throw new Error('Savings account not found')

    const interestRate = this.config.interestRate || 6 // 6% per annum
    const daysInYear = 365
    const lastCalculation = new Date(savings.lastInterestCalculation)
    const now = new Date()
    const daysDiff = Math.floor((now - lastCalculation) / (1000 * 60 * 60 * 24))

    if (daysDiff > 0) {
      const dailyRate = interestRate / 100 / daysInYear
      const interest = savings.balance * dailyRate * daysDiff
      
      const updated = await this.update(savingsId, {
        interestEarned: savings.interestEarned + interest,
        lastInterestCalculation: now.toISOString()
      })

      return { interest, newInterestEarned: updated.interestEarned }
    }

    return { interest: 0, newInterestEarned: savings.interestEarned }
  }

  async getStats() {
    let totalSavings = 0
    let totalInterest = 0
    let activeAccounts = 0
    
    try {
      const stream = this.db.createReadStream()
      for await (const { key, value } of stream) {
        if (key.startsWith(`${this.collection}:`)) {
          const savings = JSON.parse(value)
          if (savings.status === 'active') {
            totalSavings += savings.balance
            totalInterest += savings.interestEarned || 0
            activeAccounts++
          }
        }
      }
    } catch (error) {
      console.error('Error calculating savings stats:', error)
    }
    
    const averageInterestRate = this.config.interestRate || 6
    
    return {
      totalSavings,
      totalInterest,
      activeAccounts,
      averageInterestRate
    }
  }
}

export { SavingsModel }