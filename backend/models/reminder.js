import { BaseModel } from './base.js'

class ReminderModel extends BaseModel {
  constructor(db) {
    super(db)
    this.collection = 'reminders'
  }

  async create(data) {
    const reminder = await super.create({
      ...data,
      createdDate: new Date().toISOString(),
      isRead: false,
      status: 'active'
    })

    return reminder
  }

  async findByType(type) {
    const results = []
    
    try {
      const stream = this.db.createReadStream()
      for await (const { key, value } of stream) {
        if (key.startsWith(`${this.collection}:`)) {
          const reminder = JSON.parse(value)
          if (reminder.type === type && reminder.status === 'active') {
            results.push(reminder)
          }
        }
      }
    } catch (error) {
      console.error('Error searching reminders by type:', error)
    }
    
    return results.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate))
  }

  async findByMember(memberId) {
    const results = []
    
    try {
      const stream = this.db.createReadStream()
      for await (const { key, value } of stream) {
        if (key.startsWith(`${this.collection}:`)) {
          const reminder = JSON.parse(value)
          if (reminder.memberId === memberId && reminder.status === 'active') {
            results.push(reminder)
          }
        }
      }
    } catch (error) {
      console.error('Error searching reminders by member:', error)
    }
    
    return results.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate))
  }

  async findPending() {
    const results = []
    const today = new Date().toISOString().split('T')[0]
    
    try {
      const stream = this.db.createReadStream()
      for await (const { key, value } of stream) {
        if (key.startsWith(`${this.collection}:`)) {
          const reminder = JSON.parse(value)
          if (reminder.status === 'active' && reminder.dueDate <= today) {
            results.push(reminder)
          }
        }
      }
    } catch (error) {
      console.error('Error finding pending reminders:', error)
    }
    
    return results.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
  }

  async markAsRead(reminderId) {
    const reminder = await this.findById(reminderId)
    if (!reminder) throw new Error('Reminder not found')

    return await this.update(reminderId, {
      isRead: true,
      readDate: new Date().toISOString()
    })
  }

  async dismiss(reminderId) {
    const reminder = await this.findById(reminderId)
    if (!reminder) throw new Error('Reminder not found')

    return await this.update(reminderId, {
      status: 'dismissed',
      dismissedDate: new Date().toISOString()
    })
  }

  async generatePaymentReminders() {
    // This would typically be called by a scheduled job
    const { LoanModel } = await import('./loan.js')
    const { MemberModel } = await import('./member.js')
    
    const loanModel = new LoanModel(this.db)
    const memberModel = new MemberModel(this.db)
    
    // Get loans with upcoming payments (next 3 days)
    const upcomingDate = new Date()
    upcomingDate.setDate(upcomingDate.getDate() + 3)
    
    const loans = await loanModel.findAll()
    const reminders = []
    
    for (const loan of loans) {
      if (loan.status === 'active' && loan.nextPaymentDate) {
        const paymentDate = new Date(loan.nextPaymentDate)
        const today = new Date()
        
        // Check if payment is due within 3 days
        if (paymentDate <= upcomingDate && paymentDate >= today) {
          const member = await memberModel.findById(loan.memberId)
          
          const reminder = await this.create({
            type: 'payment_due',
            title: 'EMI Payment Due',
            message: `EMI payment of ₹${loan.emiAmount} is due on ${loan.nextPaymentDate}`,
            memberId: loan.memberId,
            memberName: member?.name || 'Unknown',
            loanId: loan.id,
            loanAccountId: loan.accountId,
            amount: loan.emiAmount,
            dueDate: loan.nextPaymentDate,
            priority: paymentDate.toDateString() === today.toDateString() ? 'high' : 'medium'
          })
          
          reminders.push(reminder)
        }
      }
    }
    
    return reminders
  }

  async generateOverdueReminders() {
    const { LoanModel } = await import('./loan.js')
    const { MemberModel } = await import('./member.js')
    
    const loanModel = new LoanModel(this.db)
    const memberModel = new MemberModel(this.db)
    
    const overdueLoans = await loanModel.getOverdueLoans()
    const reminders = []
    
    for (const loan of overdueLoans) {
      const member = await memberModel.findById(loan.memberId)
      
      const reminder = await this.create({
        type: 'payment_overdue',
        title: 'Overdue Payment',
        message: `Payment of ₹${loan.overdueAmount} is overdue since ${loan.nextPaymentDate}`,
        memberId: loan.memberId,
        memberName: member?.name || 'Unknown',
        loanId: loan.id,
        loanAccountId: loan.accountId,
        amount: loan.overdueAmount,
        dueDate: loan.nextPaymentDate,
        priority: 'high',
        overdueBy: Math.floor((new Date() - new Date(loan.nextPaymentDate)) / (1000 * 60 * 60 * 24))
      })
      
      reminders.push(reminder)
    }
    
    return reminders
  }

  async getStats() {
    let total = 0
    let unread = 0
    let high = 0
    let medium = 0
    let low = 0
    
    try {
      const stream = this.db.createReadStream()
      for await (const { key, value } of stream) {
        if (key.startsWith(`${this.collection}:`)) {
          const reminder = JSON.parse(value)
          if (reminder.status === 'active') {
            total++
            if (!reminder.isRead) unread++
            
            switch (reminder.priority) {
              case 'high': high++; break
              case 'medium': medium++; break
              case 'low': low++; break
            }
          }
        }
      }
    } catch (error) {
      console.error('Error calculating reminder stats:', error)
    }
    
    return {
      total,
      unread,
      high,
      medium,
      low
    }
  }
}

export { ReminderModel }