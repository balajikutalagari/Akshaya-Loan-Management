import PDFDocument from 'pdfkit'
import { configService } from './configService.js'

class StatementService {
  constructor(db) {
    this.db = db
    this.config = configService.config
  }

  async generateStatement(loan, member, payments, dateRange = {}) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: {
            top: 40,
            bottom: 40,
            left: 40,
            right: 40
          }
        })

        const buffers = []
        doc.on('data', buffers.push.bind(buffers))
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers)
          resolve(pdfBuffer)
        })

        this.buildStatementContent(doc, loan, member, payments, dateRange)
        doc.end()
      } catch (error) {
        reject(error)
      }
    })
  }

  buildStatementContent(doc, loan, member, payments, dateRange) {
    const companyName = this.config?.society?.name || 'Loan Management System'
    const companyShortName = this.config?.society?.shortName || 'LMS'
    const companyAddress = this.config?.company?.address || ''
    const companyPhone = this.config?.company?.phone || ''
    
    // Header - Bank style
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .fillColor('#000080')
       .text(companyName, { align: 'center' })
       .fillColor('black')
       .fontSize(8)
       .font('Helvetica')
    
    if (companyAddress) {
      doc.text(companyAddress, { align: 'center' })
    }
    if (companyPhone) {
      doc.text(`Tel: ${companyPhone}`, { align: 'center' })
    }
    
    doc.moveDown(0.3)
    
    // Statement Title with underline
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('LOAN ACCOUNT STATEMENT', { align: 'center' })
    
    // Add underline
    const titleWidth = doc.widthOfString('LOAN ACCOUNT STATEMENT')
    const titleX = (doc.page.width - titleWidth) / 2
    doc.moveTo(titleX, doc.y + 2)
       .lineTo(titleX + titleWidth, doc.y + 2)
       .stroke()
       .moveDown(0.8)
    
    // Statement Period
    const fromDate = dateRange.from || loan.disbursementDate
    const toDate = dateRange.to || new Date().toISOString().split('T')[0]
    
    doc.fontSize(9)
       .font('Helvetica')
       .text(`Statement Period: ${this.formatDate(fromDate)} to ${this.formatDate(toDate)}`, { align: 'center' })
       .text(`Statement Date: ${this.formatDate(new Date().toISOString())}`, { align: 'center' })
       .moveDown(1)
    
    // Account Information - Bank format in two columns
    const leftCol = 40
    const rightCol = 300
    let currentY = doc.y
    
    // Left column - Customer Details
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('Customer Details', leftCol, currentY)
    
    currentY += 15
    doc.fontSize(8)
       .font('Helvetica')
       .text(`Name: ${member.name}`, leftCol, currentY)
    currentY += 12
    doc.text(`Customer ID: ${member.memberId}`, leftCol, currentY)
    currentY += 12
    doc.text(`Mobile: ${member.phone}`, leftCol, currentY)
    currentY += 12
    doc.text(`Address: ${member.address || 'N/A'}`, leftCol, currentY, { width: 220 })
    
    // Right column - Loan Details
    currentY = doc.y - 45 // Reset to same level as left column
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('Loan Account Details', rightCol, currentY)
    
    currentY += 15
    doc.fontSize(8)
       .font('Helvetica')
       .text(`Loan Account No: ${loan.loanId}`, rightCol, currentY)
    currentY += 12
    doc.text(`Sanction Date: ${this.formatDate(loan.disbursementDate)}`, rightCol, currentY)
    currentY += 12
    doc.text(`Sanction Amount: ${this.formatCurrency(loan.loanAmount)}`, rightCol, currentY)
    currentY += 12
    doc.text(`Interest Rate: ${loan.interestRate || 1.5}% p.m.`, rightCol, currentY)
    currentY += 12
    doc.text(`Tenure: ${loan.tenureMonths} months`, rightCol, currentY)
    currentY += 12
    doc.text(`Maturity Date: ${this.formatDate(this.calculateMaturityDate(loan))}`, rightCol, currentY)
    
    doc.moveDown(5)
    
    // Account Summary Box
    const summaryTop = doc.y + 10
    const summaryHeight = 60
    
    // Calculate summary values based on real payments
    const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0)
    const totalPrincipalPaid = payments.reduce((sum, p) => sum + (p.principalAmount || 0), 0)
    const totalInterestPaid = payments.reduce((sum, p) => sum + (p.interestAmount || 0), 0)
    const totalSavingsPaid = payments.reduce((sum, p) => sum + (p.savingsAmount || 0), 0)
    const outstandingBalance = loan.loanAmount - totalPrincipalPaid // Calculate actual outstanding balance
    
    // Draw summary box with gradient effect
    doc.rect(40, summaryTop, 515, summaryHeight)
       .fillAndStroke('#F0F8FF', '#000080')
    
    doc.fillColor('black')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text('ACCOUNT SUMMARY', 50, summaryTop + 10)
    
    // Summary details in columns
    doc.fontSize(9)
       .font('Helvetica')
    
    const col1 = 50
    const col2 = 200
    const col3 = 350
    const col4 = 460
    
    currentY = summaryTop + 30
    
    doc.text('Opening Balance:', col1, currentY)
    currentY += 12
    doc.font('Helvetica-Bold')
       .text(this.formatCurrency(loan.loanAmount), col1, currentY)
       .font('Helvetica')
    
    currentY = summaryTop + 30
    doc.text('Total Paid:', col2, currentY)
    currentY += 12
    doc.font('Helvetica-Bold')
       .text(this.formatCurrency(totalPaid), col2, currentY)
       .font('Helvetica')
    
    currentY = summaryTop + 30
    doc.text('Payments Made:', col3, currentY)
    currentY += 12
    doc.font('Helvetica-Bold')
       .text(`${payments.length} payment${payments.length !== 1 ? 's' : ''}`, col3, currentY)
       .font('Helvetica')
    
    currentY = summaryTop + 30
    doc.text('Closing Balance:', col4, currentY)
    currentY += 12
    doc.font('Helvetica-Bold')
       .text(this.formatCurrency(outstandingBalance), col4, currentY)
    
    doc.moveDown(4)
    
    // Transaction History - Bank Statement Format
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .text('TRANSACTION HISTORY', 40, doc.y + 10)
       .moveDown(0.5)
    
    // Create comprehensive transaction records including EMI schedule
    const transactions = this.buildBankStyleTransactionHistory(loan, payments)
    
    // Transaction table - Bank format
    const tableTop = doc.y
    const tableHeaders = ['Date', 'Description', 'Value Date', 'Debit', 'Credit', 'Closing Balance']
    const colWidths = [60, 170, 60, 65, 65, 90]  // Adjusted widths to prevent overlap
    let colX = 40
    
    // Table header - Calculate total width
    const totalTableWidth = colWidths.reduce((sum, width) => sum + width, 0)
    doc.rect(40, tableTop, totalTableWidth, 20)
       .fillAndStroke('#E0E0E0', '#000000')
    
    // Add vertical lines for header
    colX = 40
    for (let i = 0; i < colWidths.length - 1; i++) {
      colX += colWidths[i]
      doc.moveTo(colX, tableTop)
         .lineTo(colX, tableTop + 20)
         .stroke()
    }
    
    doc.fillColor('black')
       .fontSize(8)
       .font('Helvetica-Bold')
    
    colX = 40
    tableHeaders.forEach((header, i) => {
      doc.text(header, colX + 3, tableTop + 6, { width: colWidths[i] - 6 })
      colX += colWidths[i]
    })
    
    // Table rows
    currentY = tableTop + 20
    doc.font('Helvetica')
       .fontSize(8)
    
    let runningBalance = 0 // Will be set after disbursement
    let finalBalance = 0   // Track final balance for summary
    const maxRows = 35 // Maximum rows per page (increased to fit more content)
    let rowCount = 0
    
    // Pre-calculate closing balance for each transaction
    let currentBalance = 0
    transactions.forEach((trans, idx) => {
      if (trans.type === 'disbursement') {
        currentBalance = trans.debit // Loan amount is the opening balance
        trans.closingBalance = currentBalance
      } else if (trans.type === 'payment') {
        // Find the payment details to get principal amount
        // Use paymentId for exact match if available
        const payment = trans.paymentId 
          ? payments.find(p => p.id === trans.paymentId)
          : payments.find(p => 
              (p.paymentDate || p.createdAt) === trans.date && 
              p.amount === trans.credit
            )
        
        const principalPaid = payment?.principalAmount || 0
        // Only reduce balance if there's principal payment
        if (principalPaid > 0) {
          currentBalance = Math.max(0, currentBalance - principalPaid)
        }
        trans.closingBalance = currentBalance
      } else {
        // Charges or fees increase the balance
        currentBalance = currentBalance + trans.debit
        trans.closingBalance = currentBalance
      }
    })
    
    transactions.forEach((trans, index) => {
      // Check if we need a new page (considering space for content + summary)
      if (rowCount >= maxRows || currentY > doc.page.height - 200) {
        // Add new page if needed
        doc.addPage()
        currentY = 50
        rowCount = 0
        
        // Re-add table header on new page
        doc.rect(40, currentY, totalTableWidth, 20)
           .fillAndStroke('#E0E0E0', '#000000')
        
        // Add vertical lines for header on new page
        colX = 40
        for (let i = 0; i < colWidths.length - 1; i++) {
          colX += colWidths[i]
          doc.moveTo(colX, currentY)
             .lineTo(colX, currentY + 20)
             .stroke()
        }
        
        doc.fillColor('black')
           .fontSize(8)
           .font('Helvetica-Bold')
        
        colX = 40
        tableHeaders.forEach((header, i) => {
          doc.text(header, colX + 3, currentY + 6, { width: colWidths[i] - 6 })
          colX += colWidths[i]
        })
        currentY += 20
        doc.font('Helvetica')
        rowCount = 0
      }
      
      // Alternate row background
      if (index % 2 === 0) {
        doc.rect(40, currentY, totalTableWidth, 18)
           .fill('#F8F8F8')
           .fillColor('black')
      }
      
      // Use pre-calculated closing balance
      runningBalance = trans.closingBalance
      
      // Draw row border
      doc.rect(40, currentY, totalTableWidth, 18)
         .stroke()
      
      // Add vertical lines for data rows
      colX = 40
      for (let i = 0; i < colWidths.length - 1; i++) {
        colX += colWidths[i]
        doc.moveTo(colX, currentY)
           .lineTo(colX, currentY + 18)
           .stroke()
      }
      
      // Row data
      colX = 40
      doc.fontSize(7)
      doc.text(this.formatDate(trans.date), colX + 2, currentY + 4, { width: colWidths[0] - 4 })
      colX += colWidths[0]
      
      // Handle long description text - truncate or wrap
      const maxDescLength = 35
      let description = trans.description
      if (description.length > maxDescLength) {
        // Split into shorter parts for multi-line display
        const parts = []
        if (description.includes('(')) {
          const mainPart = description.substring(0, description.indexOf('('))
          const detailPart = description.substring(description.indexOf('('))
          parts.push(mainPart.trim())
          if (detailPart.length > 40) {
            // Simplify the breakdown part
            parts.push(detailPart.substring(0, 40) + '...')
          } else {
            parts.push(detailPart)
          }
        } else {
          parts.push(description.substring(0, maxDescLength) + '...')
        }
        description = parts[0]
      }
      
      doc.text(description, colX + 2, currentY + 4, { width: colWidths[1] - 4, ellipsis: true })
      colX += colWidths[1]
      
      doc.text(this.formatDate(trans.valueDate), colX + 2, currentY + 4, { width: colWidths[2] - 4 })
      colX += colWidths[2]
      
      doc.text(trans.debit > 0 ? this.formatCurrency(trans.debit) : '-', colX + 2, currentY + 4, { 
        width: colWidths[3] - 4, align: 'right' 
      })
      colX += colWidths[3]
      
      doc.text(trans.credit > 0 ? this.formatCurrency(trans.credit) : '-', colX + 2, currentY + 4, { 
        width: colWidths[4] - 4, align: 'right' 
      })
      colX += colWidths[4]
      
      doc.font('Helvetica-Bold')
         .text(this.formatCurrency(Math.abs(runningBalance)), colX + 2, currentY + 4, { 
           width: colWidths[5] - 4, align: 'right' 
         })
         .font('Helvetica')
      
      finalBalance = runningBalance // Track the final balance
      currentY += 18
      rowCount++
    })
    
    // Summary totals
    currentY += 10
    doc.moveTo(40, currentY)
       .lineTo(40 + totalTableWidth, currentY)
       .stroke()
    
    currentY += 20
    
    // Check if we need a new page for the summary
    if (currentY > doc.page.height - 300) {
      doc.addPage()
      currentY = 50
    }
    
    // Bank-style Account Summary
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .text('ACCOUNT SUMMARY', 40, currentY)
    
    currentY += 20
    
    // Calculate values based on real payments
    const outstandingPrincipal = loan.loanAmount - totalPrincipalPaid
    const lastPaymentDate = payments.length > 0 ? 
      payments.sort((a, b) => new Date(b.paymentDate || b.createdAt) - new Date(a.paymentDate || a.createdAt))[0] : null
    
    // Get final balance from last transaction or use loan amount if no transactions
    if (transactions.length > 0) {
      finalBalance = transactions[transactions.length - 1].closingBalance || loan.loanAmount
    } else {
      finalBalance = loan.loanAmount
    }
    
    const summaryData = [
      // Loan Details Section
      { section: 'Loan Details', items: [
        ['Original Loan Amount:', this.formatCurrency(loan.loanAmount)],
        ['Disbursement Date:', this.formatDate(loan.disbursementDate)],
        ['Maturity Date:', this.formatDate(this.calculateMaturityDate(loan))],
        ['Interest Rate:', `${loan.interestRate || 1.5}% per month`],
        ['Loan Tenure:', `${loan.tenureMonths || 0} months`]
      ]},
      
      // Payment Status Section  
      { section: 'Payment Status', items: [
        ['Total Payments Made:', `${payments.length} payment${payments.length !== 1 ? 's' : ''}`],
        ['Last Payment Date:', lastPaymentDate ? this.formatDate(lastPaymentDate.paymentDate || lastPaymentDate.createdAt) : 'No payments yet'],
        ['Last Payment Amount:', lastPaymentDate ? this.formatCurrency(lastPaymentDate.amount || 0) : 'N/A'],
        ['Payment Period:', payments.length > 0 ? `${this.formatDate(loan.disbursementDate)} to ${this.formatDate(lastPaymentDate.paymentDate || lastPaymentDate.createdAt)}` : 'No payments yet']
      ]},
      
      // Financial Summary Section
      { section: 'Financial Summary', items: [
        ['Total Principal Paid:', this.formatCurrency(totalPrincipalPaid)],
        ['Total Interest Paid:', this.formatCurrency(totalInterestPaid)],
        ['Total Savings Collected:', this.formatCurrency(totalSavingsPaid)],
        ['Total Amount Paid:', this.formatCurrency(totalPaid)],
        ['Outstanding Principal:', this.formatCurrency(outstandingPrincipal)],
        ['Current Outstanding Balance:', this.formatCurrency(Math.abs(finalBalance))]
      ]}
    ]
    
    doc.fontSize(8)
       .font('Helvetica')
    
    summaryData.forEach(({ section, items }) => {
      // Section header
      doc.fontSize(9)
         .font('Helvetica-Bold')
         .text(section, 40, currentY)
         .fontSize(8)
         .font('Helvetica')
      currentY += 15
      
      // Section items
      items.forEach(([label, value]) => {
        doc.text(`  ${label}`, 40, currentY)
           .font('Helvetica-Bold')
           .text(value, 300, currentY, { align: 'right', width: 200 })
           .font('Helvetica')
        currentY += 12
      })
      
      currentY += 8 // Space between sections
    })
    
    // Footer
    const pageHeight = doc.page.height - doc.page.margins.bottom
    doc.fontSize(8)
       .font('Helvetica')
       .fillColor('#666666')
       .text('This is a computer-generated statement and does not require a signature.', 40, pageHeight - 30, { align: 'center', width: totalTableWidth })
       .text(`Generated on: ${this.formatDate(new Date().toISOString())}`, 40, pageHeight - 20, { align: 'center', width: totalTableWidth })
  }

  buildBankStyleTransactionHistory(loan, payments) {
    const transactions = []
    
    // Loan Disbursement
    transactions.push({
      date: loan.disbursementDate,
      valueDate: loan.disbursementDate,
      description: `Loan Disbursement - ${loan.loanId}`,
      debit: loan.loanAmount,
      credit: 0,
      type: 'disbursement'
    })
    
    // Only show real payments - not EMI schedule entries for new loans
    if (payments && payments.length > 0) {
      payments.forEach(payment => {
        let paymentDescription = 'Payment'
        
        // Add EMI number if available
        if (payment.emiNumbers && payment.emiNumbers.length > 0) {
          paymentDescription += ` - EMI #${payment.emiNumbers.join(',')}`
        }
        
        // Add shortened breakdown with compact amounts
        let breakdown = []
        if (payment.principalAmount > 0) {
          breakdown.push(`P:${this.formatCompactAmount(payment.principalAmount)}`)
        }
        if (payment.interestAmount > 0) {
          breakdown.push(`I:${this.formatCompactAmount(payment.interestAmount)}`)
        }
        if (payment.savingsAmount > 0) {
          breakdown.push(`S:${this.formatCompactAmount(payment.savingsAmount)}`)
        }
        
        if (breakdown.length > 0) {
          paymentDescription += ` (${breakdown.join(', ')})`
        }
        
        // Add reference number if exists
        if (payment.referenceNumber) {
          paymentDescription += ` Ref:${payment.referenceNumber.substring(0, 8)}`
        }
        
        transactions.push({
          date: payment.paymentDate || payment.createdAt,
          valueDate: payment.paymentDate || payment.createdAt,
          description: paymentDescription,
          debit: 0,
          credit: payment.amount || 0,
          type: 'payment',
          paymentId: payment.id
        })
      })
    }
    
    // Additional charges and fees
    payments.forEach(payment => {
      if (payment.lateCharges && payment.lateCharges > 0) {
        transactions.push({
          date: payment.paymentDate || payment.createdAt,
          valueDate: payment.paymentDate || payment.createdAt,
          description: 'Late Payment Charges',
          debit: payment.lateCharges,
          credit: 0,
          type: 'charges'
        })
      }
      
      if (payment.processingFee && payment.processingFee > 0) {
        transactions.push({
          date: payment.paymentDate || payment.createdAt,
          valueDate: payment.paymentDate || payment.createdAt,
          description: 'Processing Fee',
          debit: payment.processingFee,
          credit: 0,
          type: 'fee'
        })
      }
    })
    
    // Sort by date, then by type (disbursement first, then dues, then payments)
    transactions.sort((a, b) => {
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)
      
      if (dateA.getTime() === dateB.getTime()) {
        // Same date - order by type
        const typeOrder = { disbursement: 1, emi_due: 2, payment: 3, charges: 4, fee: 5 }
        return (typeOrder[a.type] || 6) - (typeOrder[b.type] || 6)
      }
      return dateA - dateB
    })
    
    return transactions
  }
  
  calculateMaturityDate(loan) {
    if (!loan.disbursementDate || !loan.tenureMonths) return 'N/A'
    
    const disbursementDate = new Date(loan.disbursementDate)
    const maturityDate = new Date(disbursementDate)
    maturityDate.setMonth(maturityDate.getMonth() + loan.tenureMonths)
    
    return maturityDate.toISOString().split('T')[0]
  }

  formatDate(dateString) {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}-${month}-${year}`
  }

  formatCurrency(amount) {
    // Use Rs. instead of ₹ symbol to avoid encoding issues
    const currency = 'Rs.'
    const numValue = parseFloat(amount || 0)
    
    // Format number with commas in Indian style (lakhs/crores)
    const formatted = numValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    
    return `${currency} ${formatted}`
  }

  formatCompactAmount(amount) {
    // Format amount in compact form for breakdowns
    const numValue = parseFloat(amount || 0)
    
    if (numValue >= 100000) {
      // Display in lakhs for large amounts
      return `${(numValue / 100000).toFixed(1)}L`
    } else if (numValue >= 1000) {
      // Display in thousands
      return `${(numValue / 1000).toFixed(1)}K`
    } else {
      // Display as is for small amounts
      return numValue.toFixed(0)
    }
  }
}

export { StatementService }