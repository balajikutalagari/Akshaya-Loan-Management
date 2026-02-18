import PDFDocument from 'pdfkit'
import { configService } from './configService.js'

class ReceiptService {
  constructor(db) {
    this.db = db
    this.config = configService.config
  }

  async generatePDF(receipt) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50
          }
        })

        const buffers = []
        doc.on('data', buffers.push.bind(buffers))
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers)
          resolve(pdfBuffer)
        })

        this.buildPDFContent(doc, receipt)
        doc.end()
      } catch (error) {
        reject(error)
      }
    })
  }

  buildPDFContent(doc, receipt) {
    const companyName = this.config?.company?.name || 'Loan Management System'
    const companyAddress = this.config?.company?.address || ''
    const companyPhone = this.config?.company?.phone || ''
    const companyEmail = this.config?.company?.email || ''

    doc.fontSize(20)
       .font('Helvetica-Bold')
       .text(companyName, { align: 'center' })
       .fontSize(10)
       .font('Helvetica')

    if (companyAddress) {
      doc.text(companyAddress, { align: 'center' })
    }
    if (companyPhone || companyEmail) {
      doc.text(`${companyPhone} | ${companyEmail}`, { align: 'center' })
    }

    doc.moveDown()
       .fontSize(16)
       .font('Helvetica-Bold')
       .text('PAYMENT RECEIPT', { align: 'center', underline: true })
       .moveDown()

    doc.fontSize(10)
       .font('Helvetica')

    const leftColumn = 50
    const rightColumn = 300
    let currentY = doc.y

    doc.text('Receipt No:', leftColumn, currentY)
       .font('Helvetica-Bold')
       .text(receipt.receiptNumber, leftColumn + 70, currentY)
       .font('Helvetica')

    doc.text('Date:', rightColumn, currentY)
       .font('Helvetica-Bold')
       .text(new Date(receipt.issueDate).toLocaleDateString(), rightColumn + 40, currentY)
       .font('Helvetica')

    currentY += 20

    doc.moveTo(50, currentY)
       .lineTo(545, currentY)
       .stroke()
       .moveDown()

    currentY += 10

    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('Member Details', leftColumn, currentY)
       .fontSize(10)
       .font('Helvetica')

    currentY += 20

    doc.text('Name:', leftColumn, currentY)
       .text(receipt.memberName || 'N/A', leftColumn + 70, currentY)

    currentY += 15

    doc.text('Phone:', leftColumn, currentY)
       .text(receipt.memberPhone || 'N/A', leftColumn + 70, currentY)

    currentY += 15

    doc.text('Loan Number:', leftColumn, currentY)
       .text(receipt.loanNumber || 'N/A', leftColumn + 70, currentY)

    currentY += 25

    doc.moveTo(50, currentY)
       .lineTo(545, currentY)
       .stroke()

    currentY += 10

    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('Payment Details', leftColumn, currentY)
       .fontSize(10)
       .font('Helvetica')

    currentY += 20

    const paymentDetails = [
      ['Payment Date:', receipt.paymentDate ? new Date(receipt.paymentDate).toLocaleDateString() : 'N/A'],
      ['Payment Mode:', receipt.paymentMode || 'Cash'],
      ['EMI Number(s):', (receipt.emiNumbers && receipt.emiNumbers.length > 0) ? receipt.emiNumbers.join(', ') : 'N/A'],
    ]

    paymentDetails.forEach(([label, value]) => {
      doc.text(label, leftColumn, currentY)
         .text(value, leftColumn + 100, currentY)
      currentY += 15
    })

    currentY += 10

    // Add EMI Schedule if available
    if (receipt.emiDetails && receipt.emiDetails.length > 0) {
      doc.moveTo(50, currentY)
         .lineTo(545, currentY)
         .stroke()

      currentY += 10

      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('EMI Schedule Details', leftColumn, currentY)
         .fontSize(8)
         .font('Helvetica')

      currentY += 15

      // Table headers
      doc.font('Helvetica-Bold')
         .text('EMI#', leftColumn, currentY)
         .text('Due Date', leftColumn + 35, currentY)
         .text('O/B', leftColumn + 95, currentY)
         .text('Principal', leftColumn + 155, currentY)
         .text('Interest', leftColumn + 215, currentY)
         .text('Savings', leftColumn + 270, currentY)
         .text('C/B', leftColumn + 320, currentY)
         .text('Total', leftColumn + 380, currentY)
         .font('Helvetica')

      currentY += 12

      // EMI rows
      receipt.emiDetails.forEach(emi => {
        doc.fontSize(8)
           .text(emi.emiNumber.toString(), leftColumn, currentY)
           .text(new Date(emi.dueDate).toLocaleDateString('en-IN'), leftColumn + 35, currentY)
           .text(this.formatCompactCurrency(emi.openingBalance), leftColumn + 95, currentY)
           .text(this.formatCompactCurrency(emi.monthlyPrincipal), leftColumn + 155, currentY)
           .text(this.formatCompactCurrency(emi.monthlyInterest), leftColumn + 215, currentY)
           .text(this.formatCompactCurrency(emi.monthlySavings), leftColumn + 270, currentY)
           .text(this.formatCompactCurrency(emi.closingBalance), leftColumn + 320, currentY)
           .text(this.formatCompactCurrency(emi.totalPayment), leftColumn + 380, currentY)
        currentY += 12
      })

      currentY += 10
    }

    doc.moveTo(50, currentY)
       .lineTo(545, currentY)
       .stroke()

    currentY += 10

    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('Payment Summary', leftColumn, currentY)
       .fontSize(10)
       .font('Helvetica')

    currentY += 20

    const amounts = [
      ['Principal Amount:', this.formatCurrency(receipt.principalAmount)],
      ['Interest Amount:', this.formatCurrency(receipt.interestAmount)],
      ['Savings Amount:', this.formatCurrency(receipt.savingsAmount)],
      ['Late Charges:', this.formatCurrency(receipt.lateCharges)],
    ]

    amounts.forEach(([label, value]) => {
      doc.text(label, leftColumn, currentY)
         .text(value, rightColumn + 100, currentY, { align: 'right', width: 145 })
      currentY += 15
    })

    currentY += 5

    doc.moveTo(300, currentY)
       .lineTo(545, currentY)
       .stroke()

    currentY += 10

    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('Total Amount Paid:', leftColumn, currentY)
       .text(this.formatCurrency(receipt.paymentAmount), rightColumn + 100, currentY, { align: 'right', width: 145 })

    currentY += 20

    doc.fontSize(10)
       .font('Helvetica')
       .text('Outstanding Balance:', leftColumn, currentY)
       .font('Helvetica-Bold')
       .text(this.formatCurrency(receipt.outstandingBalance), rightColumn + 100, currentY, { align: 'right', width: 145 })

    if (receipt.remarks) {
      currentY += 25
      doc.font('Helvetica')
         .text('Remarks:', leftColumn, currentY)
         .text(receipt.remarks, leftColumn, currentY + 15, { width: 495 })
    }

    doc.fontSize(8)
       .font('Helvetica')
       .text('This is a computer-generated receipt and does not require a signature.', 50, 750, { align: 'center' })

    if (receipt.status === 'voided') {
      doc.fontSize(60)
         .font('Helvetica-Bold')
         .fillColor('red')
         .opacity(0.3)
         .text('VOIDED', 150, 350, { align: 'center' })
         .opacity(1)
         .fillColor('black')
    }
  }

  formatCurrency(amount) {
    // Use Rs. instead of ₹ symbol to avoid encoding issues
    const currency = 'Rs.'
    const numValue = parseFloat(amount || 0)
    
    // Format number with commas
    const formatted = numValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    
    return `${currency} ${formatted}`
  }

  formatCompactCurrency(amount) {
    const value = parseFloat(amount || 0)
    if (value >= 100000) {
      return `Rs.${(value / 100000).toFixed(1)}L`
    }
    // Format number with commas
    const formatted = value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    return `Rs. ${formatted}`
  }

  async sendByEmail(receipt, email) {
    console.log(`Sending receipt ${receipt.receiptNumber} to ${email}`)
    return { success: true, message: 'Email functionality to be implemented' }
  }

  async sendBySMS(receipt, phone) {
    console.log(`Sending receipt ${receipt.receiptNumber} to ${phone}`)
    return { success: true, message: 'SMS functionality to be implemented' }
  }
}

export { ReceiptService }