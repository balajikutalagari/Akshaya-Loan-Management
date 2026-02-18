import express from 'express'
import { ReceiptModel } from '../models/Receipt.js'
import { PaymentModel } from '../models/Payment.js'
import { LoanModel } from '../models/Loan.js'
import { MemberModel } from '../models/Member.js'
import { ReceiptService } from '../services/receiptService.js'

function createReceiptRoutes(db) {
  const router = express.Router()
  const receiptModel = new ReceiptModel(db)
  const paymentModel = new PaymentModel(db)
  const loanModel = new LoanModel(db)
  const memberModel = new MemberModel(db)
  const receiptService = new ReceiptService(db)

  router.post('/generate/:paymentId', async (req, res) => {
    try {
      const { paymentId } = req.params
      
      const existingReceipt = await receiptModel.findByPaymentId(paymentId)
      if (existingReceipt) {
        return res.json(existingReceipt)
      }

      const payment = await paymentModel.findById(paymentId)
      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' })
      }

      // Fetch loan and member details with proper error handling
      let loan = null
      let member = null
      
      if (payment.loanId) {
        loan = await loanModel.findById(payment.loanId)
        if (!loan) {
          console.log('Warning: Loan not found for ID:', payment.loanId)
        }
      }
      
      if (payment.memberId) {
        member = await memberModel.findById(payment.memberId)
        if (!member) {
          console.log('Warning: Member not found for ID:', payment.memberId)
        }
      }

      // Get EMI details from loan schedule for paid EMIs
      const paidEmiDetails = []
      if (loan && loan.schedule && payment.emiNumbers && payment.emiNumbers.length > 0) {
        for (const emiNum of payment.emiNumbers) {
          const emi = loan.schedule.find(e => e.emiNumber === emiNum)
          if (emi) {
            paidEmiDetails.push({
              emiNumber: emi.emiNumber,
              dueDate: emi.dueDate,
              openingBalance: emi.openingBalance,
              monthlyPrincipal: emi.monthlyPrincipal,
              monthlyInterest: emi.monthlyInterest,
              closingBalance: emi.closingBalance,
              monthlySavings: emi.monthlySavings || 0,
              totalPayment: emi.totalPayment
            })
          }
        }
      }

      // Calculate principal and interest from payment or EMI details
      let principalAmount = payment.principalAmount || 0
      let interestAmount = payment.interestAmount || 0
      let savingsAmount = payment.savingsAmount || 0
      
      // If we have EMI details, calculate totals from them
      if (paidEmiDetails.length > 0) {
        principalAmount = paidEmiDetails.reduce((sum, emi) => sum + (emi.monthlyPrincipal || 0), 0)
        interestAmount = paidEmiDetails.reduce((sum, emi) => sum + (emi.monthlyInterest || 0), 0)
        savingsAmount = paidEmiDetails.reduce((sum, emi) => sum + (emi.monthlySavings || 0), 0)
      }

      const receiptData = {
        paymentId: payment.id,
        memberId: payment.memberId || '',
        loanId: payment.loanId || '',
        memberName: member?.name || payment.memberName || 'N/A',
        memberPhone: member?.phone || payment.memberPhone || 'N/A',
        loanNumber: loan?.loanId || payment.loanNumber || 'N/A',
        paymentAmount: payment.amount || 0,
        paymentMode: payment.paymentMode || payment.method || 'Cash',
        paymentDate: payment.paymentDate || new Date().toISOString().split('T')[0],
        emiNumbers: payment.emiNumbers || [],
        emiDetails: paidEmiDetails,
        principalAmount: principalAmount,
        interestAmount: interestAmount,
        savingsAmount: savingsAmount,
        lateCharges: payment.lateCharges || 0,
        outstandingBalance: loan ? (loan.outstandingBalance - payment.amount) : 0,
        remarks: payment.remarks || '',
      }

      const receipt = await receiptModel.create(receiptData)
      res.json(receipt)
    } catch (error) {
      console.error('Error generating receipt:', error)
      res.status(500).json({ error: error.message })
    }
  })

  router.get('/:id', async (req, res) => {
    try {
      const receipt = await receiptModel.findById(req.params.id)
      if (!receipt) {
        return res.status(404).json({ error: 'Receipt not found' })
      }
      res.json(receipt)
    } catch (error) {
      console.error('Error fetching receipt:', error)
      res.status(500).json({ error: error.message })
    }
  })

  router.get('/number/:receiptNumber', async (req, res) => {
    try {
      const receipt = await receiptModel.getReceiptByNumber(req.params.receiptNumber)
      if (!receipt) {
        return res.status(404).json({ error: 'Receipt not found' })
      }
      res.json(receipt)
    } catch (error) {
      console.error('Error fetching receipt by number:', error)
      res.status(500).json({ error: error.message })
    }
  })

  router.get('/member/:memberId', async (req, res) => {
    try {
      const receipts = await receiptModel.findByMemberId(req.params.memberId)
      res.json(receipts)
    } catch (error) {
      console.error('Error fetching member receipts:', error)
      res.status(500).json({ error: error.message })
    }
  })

  router.get('/loan/:loanId', async (req, res) => {
    try {
      const receipts = await receiptModel.findByLoanId(req.params.loanId)
      res.json(receipts)
    } catch (error) {
      console.error('Error fetching loan receipts:', error)
      res.status(500).json({ error: error.message })
    }
  })

  router.get('/payment/:paymentId', async (req, res) => {
    try {
      const receipt = await receiptModel.findByPaymentId(req.params.paymentId)
      if (!receipt) {
        return res.status(404).json({ error: 'Receipt not found for this payment' })
      }
      res.json(receipt)
    } catch (error) {
      console.error('Error fetching receipt by payment:', error)
      res.status(500).json({ error: error.message })
    }
  })

  router.get('/', async (req, res) => {
    try {
      const { fromDate, toDate } = req.query
      
      let receipts
      if (fromDate && toDate) {
        receipts = await receiptModel.getReceiptsByDateRange(fromDate, toDate)
      } else {
        receipts = await receiptModel.findAll()
      }
      
      res.json(receipts)
    } catch (error) {
      console.error('Error fetching receipts:', error)
      res.status(500).json({ error: error.message })
    }
  })

  router.get('/:id/pdf', async (req, res) => {
    try {
      const receipt = await receiptModel.findById(req.params.id)
      if (!receipt) {
        return res.status(404).json({ error: 'Receipt not found' })
      }

      const pdfBuffer = await receiptService.generatePDF(receipt)
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="receipt-${receipt.receiptNumber}.pdf"`,
        'Content-Length': pdfBuffer.length
      })
      
      res.send(pdfBuffer)
    } catch (error) {
      console.error('Error generating PDF:', error)
      res.status(500).json({ error: error.message })
    }
  })

  router.post('/:id/void', async (req, res) => {
    try {
      const receipt = await receiptModel.voidReceipt(req.params.id)
      res.json(receipt)
    } catch (error) {
      console.error('Error voiding receipt:', error)
      res.status(500).json({ error: error.message })
    }
  })

  router.post('/:id/resend', async (req, res) => {
    try {
      const { email, phone } = req.body
      const receipt = await receiptModel.findById(req.params.id)
      
      if (!receipt) {
        return res.status(404).json({ error: 'Receipt not found' })
      }

      if (email) {
        await receiptService.sendByEmail(receipt, email)
      }
      
      if (phone) {
        await receiptService.sendBySMS(receipt, phone)
      }

      res.json({ message: 'Receipt sent successfully' })
    } catch (error) {
      console.error('Error resending receipt:', error)
      res.status(500).json({ error: error.message })
    }
  })

  return router
}

export { createReceiptRoutes }