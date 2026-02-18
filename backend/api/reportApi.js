import express from 'express'
import { MemberModel } from '../models/member.js'
import { LoanModel } from '../models/loan.js'
import { PaymentModel } from '../models/payment.js'
import { SavingsModel } from '../models/savings.js'

const router = express.Router()

// Helper function to generate CSV content
const generateCSV = (data, headers) => {
  const csvHeaders = headers.join(',')
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header] || ''
      // Escape quotes and wrap in quotes if contains comma
      return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
        ? `"${value.replace(/"/g, '""')}"` 
        : value
    }).join(',')
  })
  return [csvHeaders, ...csvRows].join('\n')
}

// Collection report
router.post('/collection', async (req, res) => {
  try {
    const { fromDate, toDate } = req.body
    const paymentModel = new PaymentModel(req.db)
    const memberModel = new MemberModel(req.db)
    
    // Get all payments in date range
    const payments = await paymentModel.findAll()
    const filteredPayments = payments.filter(payment => {
      const paymentDate = new Date(payment.paymentDate)
      return paymentDate >= new Date(fromDate) && paymentDate <= new Date(toDate)
    })
    
    // Enrich with member details
    const enrichedPayments = []
    for (const payment of filteredPayments) {
      const member = await memberModel.findById(payment.memberId)
      enrichedPayments.push({
        'Payment Date': new Date(payment.paymentDate).toLocaleDateString(),
        'Member Name': member?.name || 'Unknown',
        'Member ID': member?.memberId || 'Unknown',
        'Loan Account': payment.loanAccountId || '',
        'Amount': payment.amount,
        'Type': payment.type || 'payment',
        'Status': payment.status || 'completed',
        'Method': payment.method || 'cash',
        'Reference': payment.referenceNumber || ''
      })
    }
    
    const headers = ['Payment Date', 'Member Name', 'Member ID', 'Loan Account', 'Amount', 'Type', 'Status', 'Method', 'Reference']
    const csvContent = generateCSV(enrichedPayments, headers)
    
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename=collection_report_${fromDate}_to_${toDate}.csv`)
    res.send(csvContent)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Outstanding report
router.post('/outstanding', async (req, res) => {
  try {
    const loanModel = new LoanModel(req.db)
    const memberModel = new MemberModel(req.db)
    
    // Get all active loans
    const loans = await loanModel.findAll()
    const activeLoans = loans.filter(loan => loan.status === 'active')
    
    // Enrich with member details
    const enrichedLoans = []
    for (const loan of activeLoans) {
      const member = await memberModel.findById(loan.memberId)
      enrichedLoans.push({
        'Loan Account': loan.accountId,
        'Member Name': member?.name || 'Unknown',
        'Member ID': member?.memberId || 'Unknown',
        'Loan Amount': loan.amount,
        'Outstanding Balance': loan.outstandingAmount,
        'EMI Amount': loan.emiAmount,
        'Interest Rate': loan.interestRate,
        'Next Payment Date': loan.nextPaymentDate,
        'Disbursement Date': new Date(loan.disbursementDate).toLocaleDateString(),
        'Status': loan.status
      })
    }
    
    const headers = ['Loan Account', 'Member Name', 'Member ID', 'Loan Amount', 'Outstanding Balance', 'EMI Amount', 'Interest Rate', 'Next Payment Date', 'Disbursement Date', 'Status']
    const csvContent = generateCSV(enrichedLoans, headers)
    
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename=outstanding_loans_report.csv')
    res.send(csvContent)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Disbursement report
router.post('/disbursement', async (req, res) => {
  try {
    const { fromDate, toDate } = req.body
    const loanModel = new LoanModel(req.db)
    const memberModel = new MemberModel(req.db)
    
    // Get all loans disbursed in date range
    const loans = await loanModel.findAll()
    const filteredLoans = loans.filter(loan => {
      if (!loan.disbursementDate) return false
      const disbursementDate = new Date(loan.disbursementDate)
      return disbursementDate >= new Date(fromDate) && disbursementDate <= new Date(toDate)
    })
    
    // Enrich with member details
    const enrichedLoans = []
    for (const loan of filteredLoans) {
      const member = await memberModel.findById(loan.memberId)
      enrichedLoans.push({
        'Disbursement Date': new Date(loan.disbursementDate).toLocaleDateString(),
        'Loan Account': loan.accountId,
        'Member Name': member?.name || 'Unknown',
        'Member ID': member?.memberId || 'Unknown',
        'Loan Amount': loan.amount,
        'Interest Rate': loan.interestRate,
        'Tenure (Months)': loan.tenure,
        'EMI Amount': loan.emiAmount,
        'Processing Fee': loan.processingFee || 0,
        'Status': loan.status
      })
    }
    
    const headers = ['Disbursement Date', 'Loan Account', 'Member Name', 'Member ID', 'Loan Amount', 'Interest Rate', 'Tenure (Months)', 'EMI Amount', 'Processing Fee', 'Status']
    const csvContent = generateCSV(enrichedLoans, headers)
    
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename=disbursement_report_${fromDate}_to_${toDate}.csv`)
    res.send(csvContent)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Overdue report
router.post('/overdue', async (req, res) => {
  try {
    const loanModel = new LoanModel(req.db)
    const memberModel = new MemberModel(req.db)
    
    // Get overdue loans
    const overdueLoans = await loanModel.getOverdueLoans()
    
    // Enrich with member details
    const enrichedLoans = []
    for (const loan of overdueLoans) {
      const member = await memberModel.findById(loan.memberId)
      const daysPastDue = Math.floor((new Date() - new Date(loan.nextPaymentDate)) / (1000 * 60 * 60 * 24))
      
      enrichedLoans.push({
        'Loan Account': loan.accountId,
        'Member Name': member?.name || 'Unknown',
        'Member ID': member?.memberId || 'Unknown',
        'Member Phone': member?.phone || '',
        'EMI Amount': loan.emiAmount,
        'Overdue Amount': loan.overdueAmount || loan.emiAmount,
        'Due Date': loan.nextPaymentDate,
        'Days Past Due': daysPastDue,
        'Outstanding Balance': loan.outstandingAmount,
        'Status': loan.status
      })
    }
    
    const headers = ['Loan Account', 'Member Name', 'Member ID', 'Member Phone', 'EMI Amount', 'Overdue Amount', 'Due Date', 'Days Past Due', 'Outstanding Balance', 'Status']
    const csvContent = generateCSV(enrichedLoans, headers)
    
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename=overdue_report.csv')
    res.send(csvContent)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Savings report
router.post('/savings', async (req, res) => {
  try {
    const savingsModel = new SavingsModel(req.db)
    const memberModel = new MemberModel(req.db)
    
    // Get all savings accounts
    const savings = await savingsModel.findAll()
    
    // Enrich with member details
    const enrichedSavings = []
    for (const saving of savings) {
      const member = await memberModel.findById(saving.memberId)
      enrichedSavings.push({
        'Savings Account': saving.accountId,
        'Member Name': member?.name || 'Unknown',
        'Member ID': member?.memberId || 'Unknown',
        'Current Balance': saving.balance,
        'Interest Earned': saving.interestEarned || 0,
        'Last Transaction Date': saving.lastTransactionDate ? new Date(saving.lastTransactionDate).toLocaleDateString() : '',
        'Last Transaction Type': saving.lastTransactionType || '',
        'Last Transaction Amount': saving.lastTransactionAmount || 0,
        'Account Status': saving.status
      })
    }
    
    const headers = ['Savings Account', 'Member Name', 'Member ID', 'Current Balance', 'Interest Earned', 'Last Transaction Date', 'Last Transaction Type', 'Last Transaction Amount', 'Account Status']
    const csvContent = generateCSV(enrichedSavings, headers)
    
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename=savings_report.csv')
    res.send(csvContent)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Member list report
router.post('/memberList', async (req, res) => {
  try {
    const memberModel = new MemberModel(req.db)
    const loanModel = new LoanModel(req.db)
    const savingsModel = new SavingsModel(req.db)
    
    // Get all members
    const members = await memberModel.findAll()
    
    // Enrich with loan and savings summary
    const enrichedMembers = []
    for (const member of members) {
      const loans = await loanModel.findByMember(member.id)
      const savings = await savingsModel.findByMember(member.id)
      
      const activeLoans = loans.filter(l => l.status === 'active')
      const totalOutstanding = activeLoans.reduce((sum, loan) => sum + (loan.outstandingAmount || 0), 0)
      const totalSavings = savings.reduce((sum, saving) => sum + (saving.balance || 0), 0)
      
      enrichedMembers.push({
        'Member ID': member.memberId,
        'Name': member.name,
        'Phone': member.phone || '',
        'Email': member.email || '',
        'Address': member.address || '',
        'Join Date': new Date(member.joinDate).toLocaleDateString(),
        'Status': member.status,
        'Active Loans': activeLoans.length,
        'Total Outstanding': totalOutstanding,
        'Total Savings': totalSavings
      })
    }
    
    const headers = ['Member ID', 'Name', 'Phone', 'Email', 'Address', 'Join Date', 'Status', 'Active Loans', 'Total Outstanding', 'Total Savings']
    const csvContent = generateCSV(enrichedMembers, headers)
    
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename=member_list_report.csv')
    res.send(csvContent)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Loan list report
router.post('/loanList', async (req, res) => {
  try {
    const loanModel = new LoanModel(req.db)
    const memberModel = new MemberModel(req.db)
    
    // Get all loans
    const loans = await loanModel.findAll()
    
    // Enrich with member details
    const enrichedLoans = []
    for (const loan of loans) {
      const member = await memberModel.findById(loan.memberId)
      enrichedLoans.push({
        'Loan Account': loan.accountId,
        'Member Name': member?.name || 'Unknown',
        'Member ID': member?.memberId || 'Unknown',
        'Loan Amount': loan.amount,
        'Interest Rate': loan.interestRate,
        'Tenure (Months)': loan.tenure,
        'EMI Amount': loan.emiAmount,
        'Outstanding Balance': loan.outstandingAmount,
        'Disbursement Date': loan.disbursementDate ? new Date(loan.disbursementDate).toLocaleDateString() : '',
        'Next Payment Date': loan.nextPaymentDate || '',
        'Status': loan.status,
        'Processing Fee': loan.processingFee || 0
      })
    }
    
    const headers = ['Loan Account', 'Member Name', 'Member ID', 'Loan Amount', 'Interest Rate', 'Tenure (Months)', 'EMI Amount', 'Outstanding Balance', 'Disbursement Date', 'Next Payment Date', 'Status', 'Processing Fee']
    const csvContent = generateCSV(enrichedLoans, headers)
    
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename=loan_list_report.csv')
    res.send(csvContent)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Interest income report
router.post('/interestIncome', async (req, res) => {
  try {
    const { fromDate, toDate } = req.body
    const paymentModel = new PaymentModel(req.db)
    const loanModel = new LoanModel(req.db)
    const memberModel = new MemberModel(req.db)
    
    // Get all payments in date range
    const payments = await paymentModel.findAll()
    const filteredPayments = payments.filter(payment => {
      const paymentDate = new Date(payment.paymentDate)
      return paymentDate >= new Date(fromDate) && paymentDate <= new Date(toDate)
    })
    
    // Calculate interest portion for each payment
    const interestData = []
    for (const payment of filteredPayments) {
      if (payment.loanId) {
        const loan = await loanModel.findById(payment.loanId)
        const member = await memberModel.findById(payment.memberId)
        
        if (loan) {
          // Simple interest calculation for the payment
          const interestPortion = payment.amount * (loan.interestRate / 100) / 12 // Approximate monthly interest
          
          interestData.push({
            'Payment Date': new Date(payment.paymentDate).toLocaleDateString(),
            'Loan Account': loan.accountId,
            'Member Name': member?.name || 'Unknown',
            'Total Payment': payment.amount,
            'Interest Portion': Math.round(interestPortion * 100) / 100,
            'Principal Portion': Math.round((payment.amount - interestPortion) * 100) / 100,
            'Interest Rate': loan.interestRate
          })
        }
      }
    }
    
    const headers = ['Payment Date', 'Loan Account', 'Member Name', 'Total Payment', 'Interest Portion', 'Principal Portion', 'Interest Rate']
    const csvContent = generateCSV(interestData, headers)
    
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename=interest_income_report_${fromDate}_to_${toDate}.csv`)
    res.send(csvContent)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router