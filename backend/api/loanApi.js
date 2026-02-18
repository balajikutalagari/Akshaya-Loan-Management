import express from 'express'
import { LoanModel } from '../models/loan.js'
import { MemberModel } from '../models/member.js'
import { PaymentModel } from '../models/payment.js'
import { LoanService } from '../services/loanService.js'
import { ScheduleService } from '../services/scheduleService.js'
import { StatementService } from '../services/statementService.js'

const router = express.Router()

// Calculate loan details
router.post('/calculate', async (req, res) => {
  try {
    const loanService = new LoanService(req.db)
    const calculation = await loanService.calculateLoan(req.body)
    res.json(calculation)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Check loan eligibility
router.get('/eligibility/:memberId', async (req, res) => {
  try {
    const loanService = new LoanService(req.db)
    const { amount } = req.query
    
    const eligibility = await loanService.validateEligibility(
      req.params.memberId, 
      parseInt(amount)
    )
    res.json(eligibility)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get all loans
router.get('/', async (req, res) => {
  try {
    const loanModel = new LoanModel(req.db)
    const { limit = 50, offset = 0, status, memberId } = req.query
    
    let loans
    if (memberId) {
      loans = await loanModel.findByMemberId(memberId)
    } else if (status === 'active') {
      loans = await loanModel.getActiveLoans()
    } else {
      loans = await loanModel.findAll({ limit: parseInt(limit), offset: parseInt(offset) })
    }
    
    // Add nextEmiDate and nextEmiAmount to each loan
    const loansWithNextEmi = loans.map(loan => {
      if (loan.status === 'active' && loan.schedule && loan.schedule.length > 0) {
        const today = new Date().toISOString().split('T')[0]
        const nextEmi = loan.schedule.find(emi => 
          emi.paymentStatus === 'pending' && emi.dueDate >= today
        )
        
        if (nextEmi) {
          return {
            ...loan,
            nextEmiDate: nextEmi.dueDate,
            nextEmiAmount: nextEmi.totalPayment
          }
        }
      }
      return loan
    })
    
    res.json(loansWithNextEmi)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get overdue loans
router.get('/overdue', async (req, res) => {
  try {
    const loanModel = new LoanModel(req.db)
    const overdueLoans = await loanModel.getOverdueLoans()
    
    // Add nextEmiDate and nextEmiAmount to each overdue loan
    const loansWithNextEmi = overdueLoans.map(loan => {
      if (loan.schedule && loan.schedule.length > 0) {
        const today = new Date().toISOString().split('T')[0]
        const nextEmi = loan.schedule.find(emi => 
          emi.paymentStatus === 'pending' && emi.dueDate >= today
        )
        
        if (nextEmi) {
          return {
            ...loan,
            nextEmiDate: nextEmi.dueDate,
            nextEmiAmount: nextEmi.totalPayment
          }
        }
      }
      return loan
    })
    
    res.json(loansWithNextEmi)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get loans due today
router.get('/due-today', async (req, res) => {
  try {
    const loanModel = new LoanModel(req.db)
    const dueLoans = await loanModel.getDueToday()
    res.json(dueLoans)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get loan stats
router.get('/stats', async (req, res) => {
  try {
    const loanModel = new LoanModel(req.db)
    const stats = await loanModel.getStats()
    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get upcoming dues
router.get('/upcoming', async (req, res) => {
  try {
    const loanService = new LoanService(req.db)
    const { days = 7 } = req.query
    const upcoming = await loanService.getUpcomingDues(parseInt(days))
    res.json(upcoming)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get loan by ID
router.get('/:id', async (req, res) => {
  try {
    const loanModel = new LoanModel(req.db)
    const loan = await loanModel.findById(req.params.id)
    
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' })
    }
    
    // Add nextEmiDate and nextEmiAmount if active loan
    if (loan.status === 'active' && loan.schedule && loan.schedule.length > 0) {
      const today = new Date().toISOString().split('T')[0]
      const nextEmi = loan.schedule.find(emi => 
        emi.paymentStatus === 'pending' && emi.dueDate >= today
      )
      
      if (nextEmi) {
        loan.nextEmiDate = nextEmi.dueDate
        loan.nextEmiAmount = nextEmi.totalPayment
      }
    }
    
    res.json(loan)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create new loan
router.post('/', async (req, res) => {
  try {
    const loanModel = new LoanModel(req.db)
    const loanService = new LoanService(req.db)
    
    // Normalize amount field
    const loanData = {
      ...req.body,
      loanAmount: req.body.amount || req.body.loanAmount
    }
    
    // Validate eligibility
    const eligibility = await loanService.validateEligibility(
      loanData.memberId, 
      loanData.loanAmount
    )
    
    if (!eligibility.eligible) {
      return res.status(400).json({ 
        error: 'Loan eligibility failed', 
        issues: eligibility.issues 
      })
    }
    
    const loan = await loanModel.create(loanData)
    res.status(201).json(loan)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update loan
router.put('/:id', async (req, res) => {
  try {
    const loanModel = new LoanModel(req.db)
    const loan = await loanModel.update(req.params.id, req.body)
    res.json(loan)
  } catch (error) {
    if (error.message === 'Record not found') {
      return res.status(404).json({ error: 'Loan not found' })
    }
    res.status(500).json({ error: error.message })
  }
})

// Generate EMI schedule PDF
router.get('/:id/schedule-pdf', async (req, res) => {
  try {
    const loanModel = new LoanModel(req.db)
    const memberModel = new MemberModel(req.db)
    const scheduleService = new ScheduleService(req.db)
    
    const loan = await loanModel.findById(req.params.id)
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' })
    }
    
    const member = await memberModel.findById(loan.memberId)
    if (!member) {
      return res.status(404).json({ error: 'Member not found' })
    }
    
    const pdfBuffer = await scheduleService.generateSchedulePDF(loan, member)
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="EMI-Schedule-${loan.loanId}.pdf"`,
      'Content-Length': pdfBuffer.length
    })
    
    res.send(pdfBuffer)
  } catch (error) {
    console.error('Error generating schedule PDF:', error)
    res.status(500).json({ error: error.message })
  }
})

// Generate loan statement PDF
router.get('/:id/statement', async (req, res) => {
  try {
    const loanModel = new LoanModel(req.db)
    const memberModel = new MemberModel(req.db)
    const paymentModel = new PaymentModel(req.db)
    const statementService = new StatementService(req.db)
    
    const loan = await loanModel.findById(req.params.id)
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' })
    }
    
    const member = await memberModel.findById(loan.memberId)
    if (!member) {
      return res.status(404).json({ error: 'Member not found' })
    }
    
    // Get all payments for this loan
    const allPayments = await paymentModel.findAll({ limit: 1000 })
    const loanPayments = allPayments.filter(p => p.loanId === req.params.id && p.type === 'loan_emi')
    
    // Sort payments by date
    loanPayments.sort((a, b) => new Date(a.paymentDate || a.createdAt) - new Date(b.paymentDate || b.createdAt))
    
    // Get date range from query params if provided
    const dateRange = {
      from: req.query.from,
      to: req.query.to
    }
    
    const pdfBuffer = await statementService.generateStatement(loan, member, loanPayments, dateRange)
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Loan-Statement-${loan.loanId}-${new Date().toISOString().split('T')[0]}.pdf"`,
      'Content-Length': pdfBuffer.length
    })
    
    res.send(pdfBuffer)
  } catch (error) {
    console.error('Error generating loan statement:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router