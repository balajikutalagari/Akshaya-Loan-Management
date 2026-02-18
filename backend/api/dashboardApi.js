import express from 'express'
import { MemberModel } from '../models/member.js'
import { LoanModel } from '../models/loan.js'
import { PaymentModel } from '../models/payment.js'
import { SavingsModel } from '../models/savings.js'

const router = express.Router()

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    console.log('Dashboard stats requested...')
    
    const memberModel = new MemberModel(req.db)
    const loanModel = new LoanModel(req.db)
    const paymentModel = new PaymentModel(req.db)
    const savingsModel = new SavingsModel(req.db)
    
    console.log('Getting member stats...')
    const memberStats = await memberModel.getStats()
    console.log('Member stats:', memberStats)
    
    console.log('Getting loan stats...')
    const loanStats = await loanModel.getStats()
    console.log('Loan stats:', loanStats)
    
    console.log('Getting payment stats...')
    const todayCollection = await paymentModel.getTodayCollection()
    const paymentStats = await paymentModel.getStats()
    console.log('Today collection:', todayCollection)
    console.log('Payment stats:', paymentStats)
    
    console.log('Getting savings stats...')
    const savingsStats = await savingsModel.getStats()
    console.log('Savings stats:', savingsStats)
    
    const stats = {
      members: {
        total: memberStats.totalMembers || 0,
        active: memberStats.activeMembers || 0,
        inactive: memberStats.inactiveMembers || 0
      },
      loans: {
        total: loanStats.totalLoans || 0,
        active: loanStats.activeLoans || 0,
        closed: loanStats.closedLoans || 0,
        disbursed: loanStats.totalDisbursed || 0,
        outstanding: loanStats.totalOutstanding || 0
      },
      savings: {
        total: savingsStats.totalSavings || 0,
        members: savingsStats.activeAccounts || 0,
        averageBalance: savingsStats.activeAccounts > 0 ? Math.round(savingsStats.totalSavings / savingsStats.activeAccounts) : 0,
        totalInterest: savingsStats.totalInterest || 0,
        interestRate: savingsStats.averageInterestRate || 6
      },
      payments: {
        todayCollection: todayCollection,
        monthlyCollection: paymentStats.paymentsThisMonth || 0,
        overdueAmount: loanStats.overdueAmount || 0
      }
    }
    
    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get upcoming payments
router.get('/upcoming', async (req, res) => {
  try {
    const loanModel = new LoanModel(req.db)
    const { days = 7 } = req.query
    
    // Get due today
    const dueToday = await loanModel.getDueToday()
    
    // Get overdue loans
    const overdue = await loanModel.getOverdueLoans()
    
    const upcoming = {
      today: dueToday,
      overdue: overdue,
      thisWeek: [] // Would implement with proper date range filtering
    }
    
    res.json(upcoming)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get recent transactions
router.get('/recent', async (req, res) => {
  try {
    const { limit = 10 } = req.query
    const paymentModel = new PaymentModel(req.db)
    
    console.log('Getting recent transactions...')
    const recentPayments = await paymentModel.getRecentTransactions(parseInt(limit))
    console.log('Recent transactions:', recentPayments.length)
    
    // Transform payment data to match expected format
    const recentTransactions = recentPayments.map(payment => ({
      id: payment.id,
      type: payment.type || 'payment',
      memberName: payment.memberName || 'Unknown Member',
      memberId: payment.memberId || 'Unknown',
      amount: payment.amount || 0,
      description: payment.description || payment.type === 'disbursement' ? 'Loan Disbursement' : 'EMI Payment',
      timestamp: payment.processedDate || payment.paymentDate || new Date().toISOString(),
      status: payment.status || 'completed'
    }))
    
    res.json(recentTransactions)
  } catch (error) {
    console.error('Error getting recent transactions:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router