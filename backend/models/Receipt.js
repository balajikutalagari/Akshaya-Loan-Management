import { BaseModel } from './base.js'

class ReceiptModel extends BaseModel {
  constructor(db) {
    super(db)
    this.collection = 'receipts'
  }

  async create(data) {
    const receiptId = await this.generateReceiptId()
    
    const receipt = await super.create({
      ...data,
      receiptId,
      receiptNumber: receiptId,
      issueDate: new Date().toISOString(),
      status: 'issued',
    })

    return receipt
  }

  async generateReceiptId() {
    const sequence = await this.getNextSequence()
    const year = new Date().getFullYear()
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0')
    return `RCP-${year}${month}-${sequence.toString().padStart(5, '0')}`
  }

  async getNextSequence() {
    try {
      const data = await this.db.get('sequences:receipt')
      const current = JSON.parse(data).value
      await this.db.put('sequences:receipt', JSON.stringify({ value: current + 1 }))
      return current + 1
    } catch (error) {
      await this.db.put('sequences:receipt', JSON.stringify({ value: 1 }))
      return 1
    }
  }

  async findByPaymentId(paymentId) {
    const results = []
    
    try {
      const stream = this.db.createReadStream()
      for await (const { key, value } of stream) {
        if (key.startsWith(`${this.collection}:`)) {
          const receipt = JSON.parse(value)
          if (receipt.paymentId === paymentId) {
            return receipt
          }
        }
      }
    } catch (error) {
      console.error('Error finding receipt by payment:', error)
    }
    
    return null
  }

  async findByMemberId(memberId) {
    const results = []
    
    try {
      const stream = this.db.createReadStream()
      for await (const { key, value } of stream) {
        if (key.startsWith(`${this.collection}:`)) {
          const receipt = JSON.parse(value)
          if (receipt.memberId === memberId) {
            results.push(receipt)
          }
        }
      }
    } catch (error) {
      console.error('Error searching receipts by member:', error)
    }
    
    return results.sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate))
  }

  async findByLoanId(loanId) {
    const results = []
    
    try {
      const stream = this.db.createReadStream()
      for await (const { key, value } of stream) {
        if (key.startsWith(`${this.collection}:`)) {
          const receipt = JSON.parse(value)
          if (receipt.loanId === loanId) {
            results.push(receipt)
          }
        }
      }
    } catch (error) {
      console.error('Error searching receipts by loan:', error)
    }
    
    return results.sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate))
  }

  async getReceiptsByDateRange(fromDate, toDate) {
    const results = []
    
    try {
      const stream = this.db.createReadStream()
      for await (const { key, value } of stream) {
        if (key.startsWith(`${this.collection}:`)) {
          const receipt = JSON.parse(value)
          const issueDate = receipt.issueDate.split('T')[0]
          if (issueDate >= fromDate && issueDate <= toDate) {
            results.push(receipt)
          }
        }
      }
    } catch (error) {
      console.error('Error getting receipts by date range:', error)
    }
    
    return results.sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate))
  }

  async getReceiptByNumber(receiptNumber) {
    try {
      const stream = this.db.createReadStream()
      for await (const { key, value } of stream) {
        if (key.startsWith(`${this.collection}:`)) {
          const receipt = JSON.parse(value)
          if (receipt.receiptNumber === receiptNumber) {
            return receipt
          }
        }
      }
    } catch (error) {
      console.error('Error finding receipt by number:', error)
    }
    
    return null
  }

  async voidReceipt(receiptId) {
    const receipt = await this.findById(receiptId)
    if (!receipt) {
      throw new Error('Receipt not found')
    }

    return await this.update(receiptId, {
      status: 'voided',
      voidedDate: new Date().toISOString(),
      voidedReason: 'Payment cancelled or reversed'
    })
  }
}

export { ReceiptModel }