import express from 'express'
import { PaymentModel } from '../models/payment.js'
import { MemberModel } from '../models/member.js'
import { LoanModel } from '../models/loan.js'

const router = express.Router()

// Get all payments
router.get('/', async (req, res) => {
  try {
    const paymentModel = new PaymentModel(req.db)
    const memberModel = new MemberModel(req.db)
    const { limit = 50, offset = 0, type, memberId } = req.query
    
    let payments = await paymentModel.findAll({ limit: parseInt(limit), offset: parseInt(offset) })
    
    // Filter by type if specified
    if (type && type !== 'all') {
      payments = payments.filter(p => p.type === type)
    }
    
    // Filter by member if specified
    if (memberId) {
      payments = payments.filter(p => p.memberId === memberId)
    }
    
    // Enrich with member details
    for (const payment of payments) {
      if (payment.memberId) {
        const member = await memberModel.findById(payment.memberId)
        if (member) {
          payment.memberName = member.name
          payment.memberPhone = member.phone
        }
      }
    }
    
    res.json(payments)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get payment by ID
router.get('/:id', async (req, res) => {
  try {
    const paymentModel = new PaymentModel(req.db)
    const payment = await paymentModel.findById(req.params.id)
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' })
    }
    
    res.json(payment)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Generate payment receipt
router.get('/:id/receipt', async (req, res) => {
  try {
    const paymentModel = new PaymentModel(req.db)
    const memberModel = new MemberModel(req.db)
    const payment = await paymentModel.findById(req.params.id)
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' })
    }
    
    // Get member details
    const member = await memberModel.findById(payment.memberId)
    
    // Generate receipt (simplified - in real implementation, would generate PDF)
    const receipt = {
      paymentId: payment.paymentId,
      memberName: member?.name || 'Unknown',
      memberId: member?.memberId || 'Unknown',
      amount: payment.amount,
      paymentDate: payment.paymentDate,
      method: payment.method,
      type: payment.type,
      referenceNumber: payment.referenceNumber,
      remarks: payment.remarks
    }
    
    res.json(receipt)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get payment stats
router.get('/stats', async (req, res) => {
  try {
    const paymentModel = new PaymentModel(req.db)
    const stats = await paymentModel.getStats()
    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create new payment
router.post('/', async (req, res) => {
  try {
    const paymentModel = new PaymentModel(req.db)
    const memberModel = new MemberModel(req.db)
    const loanModel = new LoanModel(req.db)
    
    // Validate member exists
    const member = await memberModel.findById(req.body.memberId)
    if (!member) {
      return res.status(404).json({ error: 'Member not found' })
    }
    
    let paymentData = {
      ...req.body,
      memberName: member.name,
      memberPhone: member.phone
    }
    
    // Handle loan foreclosure/settlement
    if (req.body.type === 'loan_foreclosure' && req.body.loanId) {
      const loan = await loanModel.findById(req.body.loanId)
      if (!loan) {
        return res.status(404).json({ error: 'Loan not found' })
      }
      
      // Calculate settlement amount
      const outstandingPrincipal = loan.outstandingBalance || loan.loanAmount
      const pendingEmis = loan.schedule.filter(emi => emi.paymentStatus !== 'paid')
      const currentMonthInterest = pendingEmis.length > 0 ? pendingEmis[0].monthlyInterest || 0 : 0
      
      // For foreclosure, typically only current month's interest is charged
      const settlementAmount = outstandingPrincipal + currentMonthInterest
      
      if (parseFloat(req.body.amount) < settlementAmount) {
        return res.status(400).json({ 
          error: 'Insufficient amount for foreclosure',
          required: settlementAmount,
          provided: req.body.amount
        })
      }
      
      // Mark all pending EMIs as paid
      const updatedSchedule = loan.schedule.map(emi => {
        if (emi.paymentStatus !== 'paid') {
          return { ...emi, paymentStatus: 'paid', paymentDate: new Date().toISOString().split('T')[0] }
        }
        return emi
      })
      
      // Update loan status
      await loanModel.update(req.body.loanId, {
        schedule: updatedSchedule,
        status: 'closed',
        closedDate: new Date().toISOString().split('T')[0],
        outstandingBalance: 0,
        foreclosureDate: new Date().toISOString().split('T')[0],
        foreclosureAmount: settlementAmount
      })
      
      paymentData.principalAmount = outstandingPrincipal
      paymentData.interestAmount = currentMonthInterest
      paymentData.paymentType = 'foreclosure'
      paymentData.remarks = `Loan foreclosed. Settlement amount: ${settlementAmount}`
    }
    
    // If this is a loan EMI payment, process EMI details
    if (req.body.type === 'loan_emi' && req.body.loanId) {
      const loan = await loanModel.findById(req.body.loanId)
      if (!loan) {
        return res.status(404).json({ error: 'Loan not found' })
      }
      
      // Auto-select pending EMIs if not specified
      let emiNumbersToProcess = req.body.emiNumbers || []
      
      // If no EMI numbers specified, auto-select pending EMIs based on payment amount
      if (emiNumbersToProcess.length === 0 && loan.schedule) {
        const pendingEmis = loan.schedule
          .filter(emi => emi.paymentStatus !== 'paid')
          .sort((a, b) => a.emiNumber - b.emiNumber)
        
        let amountToAllocate = parseFloat(req.body.amount)
        for (const emi of pendingEmis) {
          const emiAmountDue = emi.amountDue || 
            ((emi.monthlyInterest || 0) + (emi.monthlyPrincipal || 0) + (emi.monthlySavings || 0))
          
          if (amountToAllocate > 0) {
            emiNumbersToProcess.push(emi.emiNumber)
            amountToAllocate -= emiAmountDue
            
            // If exact EMI amount covered, continue to next if more payment available
            if (amountToAllocate <= 0) break
          }
        }
      }
      
      // Process payment if EMI numbers are available (specified or auto-selected)
      if (emiNumbersToProcess.length > 0) {
        let remainingPayment = parseFloat(req.body.amount)
        let actualPrincipalPaid = 0
        let actualInterestPaid = 0
        let actualSavingsPaid = 0
        
        // Validate payment amount doesn't exceed total due
        const totalDueAmount = emiNumbersToProcess.reduce((sum, emiNum) => {
          const emi = loan.schedule.find(e => e.emiNumber === emiNum)
          if (!emi) return sum
          const amountDue = emi.amountDue || 
            ((emi.monthlyInterest || 0) + (emi.monthlyPrincipal || 0) + (emi.monthlySavings || 0))
          return sum + amountDue
        }, 0)
        
        if (parseFloat(req.body.amount) > totalDueAmount * 1.1) { // Allow 10% buffer for late fees
          console.warn(`Payment amount ${req.body.amount} exceeds total due ${totalDueAmount}. Excess will be recorded.`)
        }
        
        // Check for late payments and calculate penalties
        let totalLateFee = 0
        const currentDate = new Date()
        
        // Create a new schedule array with updated payment status
        const updatedSchedule = loan.schedule.map(emi => {
          if (emiNumbersToProcess.includes(emi.emiNumber)) {
            const emiCopy = { ...emi }
            
            // Check if payment is late (different month)
            const dueDate = new Date(emi.dueDate)
            const dueMonth = dueDate.getMonth()
            const dueYear = dueDate.getFullYear()
            const currentMonth = currentDate.getMonth()
            const currentYear = currentDate.getFullYear()
            
            // Only charge late fee if payment is in a different month or year
            if (emi.paymentStatus !== 'paid' && 
                (currentYear > dueYear || (currentYear === dueYear && currentMonth > dueMonth))) {
              // Apply late fee (configurable per loan, default Rs. 1000)
              const lateFeePerEmi = loan.lateFeeAmount || 1000
              totalLateFee += lateFeePerEmi
              emiCopy.lateFeeApplied = lateFeePerEmi
              emiCopy.lateFeeDate = currentDate.toISOString().split('T')[0]
            }
            
            // Initialize partial payment tracking if not exists
            if (!emiCopy.partialPayments) {
              emiCopy.partialPayments = {
                interestPaid: 0,
                principalPaid: 0,
                savingsPaid: 0
              }
            }
            
            // Calculate remaining amounts for this EMI
            const interestDue = (emi.monthlyInterest || 0) - (emiCopy.partialPayments.interestPaid || 0)
            const principalDue = (emi.monthlyPrincipal || 0) - (emiCopy.partialPayments.principalPaid || 0)
            const savingsDue = (emi.monthlySavings || 0) - (emiCopy.partialPayments.savingsPaid || 0)
            
            // Apply payment: Interest first, then principal, then savings
            let emiPaymentApplied = 0
            let interestPayment = 0
            let principalPayment = 0
            let savingsPayment = 0
            
            // 1. Pay interest first
            if (remainingPayment > 0 && interestDue > 0) {
              interestPayment = Math.min(remainingPayment, interestDue)
              emiCopy.partialPayments.interestPaid = (emiCopy.partialPayments.interestPaid || 0) + interestPayment
              actualInterestPaid += interestPayment
              remainingPayment -= interestPayment
              emiPaymentApplied += interestPayment
            }
            
            // 2. Then pay principal
            if (remainingPayment > 0 && principalDue > 0) {
              principalPayment = Math.min(remainingPayment, principalDue)
              emiCopy.partialPayments.principalPaid = (emiCopy.partialPayments.principalPaid || 0) + principalPayment
              actualPrincipalPaid += principalPayment
              remainingPayment -= principalPayment
              emiPaymentApplied += principalPayment
            }
            
            // 3. Finally pay savings
            if (remainingPayment > 0 && savingsDue > 0) {
              savingsPayment = Math.min(remainingPayment, savingsDue)
              emiCopy.partialPayments.savingsPaid = (emiCopy.partialPayments.savingsPaid || 0) + savingsPayment
              actualSavingsPaid += savingsPayment
              remainingPayment -= savingsPayment
              emiPaymentApplied += savingsPayment
            }
            
            // Update payment status based on amounts paid
            const totalEmiAmount = (emi.monthlyInterest || 0) + (emi.monthlyPrincipal || 0) + (emi.monthlySavings || 0)
            const totalPaidForEmi = (emiCopy.partialPayments.interestPaid || 0) + 
                                   (emiCopy.partialPayments.principalPaid || 0) + 
                                   (emiCopy.partialPayments.savingsPaid || 0)
            
            if (totalPaidForEmi >= totalEmiAmount) {
              emiCopy.paymentStatus = 'paid'
              emiCopy.paymentDate = new Date().toISOString().split('T')[0]
              emiCopy.fullyPaidOn = new Date().toISOString().split('T')[0]
            } else if (totalPaidForEmi > 0) {
              emiCopy.paymentStatus = 'partial'
              emiCopy.lastPartialPaymentDate = new Date().toISOString().split('T')[0]
              emiCopy.amountPaid = totalPaidForEmi
              emiCopy.amountDue = totalEmiAmount - totalPaidForEmi
            }
            
            // Track payment history for this EMI
            if (!emiCopy.paymentHistory) {
              emiCopy.paymentHistory = []
            }
            emiCopy.paymentHistory.push({
              date: new Date().toISOString().split('T')[0],
              amount: emiPaymentApplied,
              principal: principalPayment || 0,
              interest: interestPayment || 0,
              savings: savingsPayment || 0,
              type: totalPaidForEmi >= totalEmiAmount ? 'full' : 'partial'
            })
            
            return emiCopy
          }
          return emi
        })
        
        paymentData.principalAmount = actualPrincipalPaid
        paymentData.interestAmount = actualInterestPaid
        paymentData.savingsAmount = actualSavingsPaid
        paymentData.loanNumber = loan.loanId
        paymentData.emiNumbers = emiNumbersToProcess
        
        // Add late fee if applicable
        if (totalLateFee > 0) {
          paymentData.lateCharges = totalLateFee
          paymentData.remarks = (paymentData.remarks || '') + ` Late fee: Rs.${totalLateFee}`
        }
        paymentData.paymentType = actualPrincipalPaid + actualInterestPaid + actualSavingsPaid < 
          emiNumbersToProcess.reduce((sum, emiNum) => {
            const emi = loan.schedule.find(e => e.emiNumber === emiNum)
            return sum + (emi ? emi.totalPayment || 0 : 0)
          }, 0) ? 'partial' : 'full'
        
        // Update loan with new schedule and outstanding balance
        const updatedLoan = {
          schedule: updatedSchedule,
          outstandingBalance: Math.max(0, (loan.outstandingBalance || loan.loanAmount) - actualPrincipalPaid)
        }
        
        // Check if all EMIs are paid to update loan status
        const allPaid = updatedSchedule.every(emi => emi.paymentStatus === 'paid')
        if (allPaid) {
          updatedLoan.status = 'closed'
          updatedLoan.closedDate = new Date().toISOString().split('T')[0]
        }
        
        await loanModel.update(req.body.loanId, updatedLoan)
      }
    }
    
    const payment = await paymentModel.create(paymentData)
    res.status(201).json(payment)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router