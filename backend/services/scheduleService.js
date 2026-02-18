import PDFDocument from 'pdfkit'
import { configService } from './configService.js'

class ScheduleService {
  constructor(db) {
    this.db = db
    this.config = configService.config
  }

  async generateSchedulePDF(loan, member) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: {
            top: 30,
            bottom: 30,
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

        this.buildScheduleContent(doc, loan, member)
        doc.end()
      } catch (error) {
        reject(error)
      }
    })
  }

  buildScheduleContent(doc, loan, member) {
    const companyName = this.config?.society?.name || 'Loan Management System'
    const companyShortName = this.config?.society?.shortName || 'LMS'
    
    // Header with company name
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text(companyName, { align: 'center' })
       .fontSize(10)
       .font('Helvetica')
       .moveDown(0.5)

    // Member and loan details header
    doc.fontSize(10)
       .fillColor('#000080')
       .text(`${member.memberId} - ${member.name}, ${this.formatCurrency(loan.loanAmount)}/-`, { align: 'center' })
       .fillColor('black')
       .moveDown(0.5)

    // Tenure
    doc.text(`${loan.tenureMonths || loan.schedule.length} Months`, { align: 'center' })
       .moveDown(1)

    // Table headers with borders - improved column spacing
    const tableTop = doc.y
    const col1 = 40  // S.No.
    const col2 = 75  // Due Date
    const col3 = 135 // O/B
    const col4 = 195 // Monthly Interest
    const col5 = 255 // Monthly Principal
    const col6 = 315 // C/B
    const col7 = 375 // Monthly Savings
    const col8 = 435 // Monthly Total Payment
    const tableWidth = 495

    // Draw header background
    doc.rect(col1, tableTop, tableWidth, 20)
       .fillAndStroke('#E0E0E0', '#000000')

    // Header text with improved spacing
    doc.fillColor('black')
       .fontSize(9)
       .font('Helvetica-Bold')
       .text('S.No.', col1 + 3, tableTop + 5, { width: 30 })
       .text('Due Date', col2 + 3, tableTop + 5, { width: 55 })
       .text('O/B', col3 + 3, tableTop + 5, { width: 55, align: 'right' })
       .text('Monthly', col4 + 3, tableTop + 2, { width: 55, align: 'center' })
       .text('Interest', col4 + 3, tableTop + 10, { width: 55, align: 'center' })
       .text('Monthly', col5 + 3, tableTop + 2, { width: 55, align: 'center' })
       .text('Principal', col5 + 3, tableTop + 10, { width: 55, align: 'center' })
       .text('C/B', col6 + 3, tableTop + 5, { width: 55, align: 'right' })
       .text('Monthly', col7 + 3, tableTop + 2, { width: 55, align: 'center' })
       .text('Savings', col7 + 3, tableTop + 10, { width: 55, align: 'center' })
       .text('Monthly Total', col8 + 3, tableTop + 2, { width: 60, align: 'center' })
       .text('Payment', col8 + 3, tableTop + 10, { width: 60, align: 'center' })

    let currentY = tableTop + 20
    doc.font('Helvetica')
       .fontSize(8)

    // Table rows
    loan.schedule.forEach((emi, index) => {
      // Alternate row background
      if (index % 2 === 0) {
        doc.rect(col1, currentY, tableWidth, 15)
           .fill('#F8F8F8')
           .fillColor('black')
      }

      // Draw row borders
      doc.rect(col1, currentY, tableWidth, 15)
         .stroke()

      // Row data with improved column widths
      doc.text(emi.emiNumber.toString(), col1 + 3, currentY + 3, { width: 30 })
         .text(this.formatDate(emi.dueDate), col2 + 3, currentY + 3, { width: 55 })
         .text(this.formatNumber(emi.openingBalance), col3 + 3, currentY + 3, { width: 55, align: 'right' })
         .text(this.formatNumber(emi.monthlyInterest), col4 + 3, currentY + 3, { width: 55, align: 'right' })
         .text(this.formatNumber(emi.monthlyPrincipal), col5 + 3, currentY + 3, { width: 55, align: 'right' })
         .text(this.formatNumber(emi.closingBalance), col6 + 3, currentY + 3, { width: 55, align: 'right' })
         .text(this.formatNumber(emi.monthlySavings || 0), col7 + 3, currentY + 3, { width: 55, align: 'right' })
         .text(this.formatNumber(emi.totalPayment), col8 + 3, currentY + 3, { width: 60, align: 'right' })

      currentY += 15
    })

    // Total row
    doc.rect(col1, currentY, tableWidth, 20)
       .fillAndStroke('#E0E0E0', '#000000')
       .fillColor('black')

    doc.font('Helvetica-Bold')
       .fontSize(9)
       .text('Total Interest', col1 + 5, currentY + 5, { width: 145 })

    const totalInterest = loan.schedule.reduce((sum, emi) => sum + emi.monthlyInterest, 0)
    const totalPrincipal = loan.schedule.reduce((sum, emi) => sum + emi.monthlyPrincipal, 0)
    const totalSavings = loan.schedule.reduce((sum, emi) => sum + (emi.monthlySavings || 0), 0)
    
    doc.text(this.formatNumber(totalInterest), col4 + 5, currentY + 5, { width: 75, align: 'right' })
       .text(this.formatNumber(totalPrincipal), col5 + 5, currentY + 5, { width: 75, align: 'right' })
       .text(this.formatNumber(totalSavings), col7 + 5, currentY + 5, { width: 55, align: 'right' })

    currentY += 30

    // Initial collection details
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('Initial Collection Details:', col1, currentY)
       .font('Helvetica')
       .fontSize(9)

    currentY += 20

    const fees = configService.getFees()
    const processingFee = configService.getProcessingFee(loan.loanAmount)
    
    const initialDetails = [
      ['Processing Fee', processingFee],
      ['Share capital', fees.shareCapital.amount],
      ['Savings', loan.schedule[0]?.monthlySavings || 800],
      ['Membership Fee', fees.membership.amount]
    ]

    initialDetails.forEach(([label, amount]) => {
      doc.text(label, col1 + 20, currentY)
         .text(this.formatNumber(amount), col3, currentY, { align: 'right' })
      currentY += 15
    })

    doc.moveTo(col1 + 20, currentY)
       .lineTo(col3 + 60, currentY)
       .stroke()

    currentY += 5
    const total = processingFee + fees.shareCapital.amount + (loan.schedule[0]?.monthlySavings || 800) + fees.membership.amount
    doc.font('Helvetica-Bold')
       .text('Total', col1 + 20, currentY)
       .text(this.formatNumber(total), col3, currentY, { align: 'right' })

    currentY += 25

    // Terms and conditions
    doc.font('Helvetica')
       .fontSize(8)
       .text('1. Amount should be paid as per the given repayment schedule.', col1, currentY)
    currentY += 12
    doc.text('2. The following amounts should be paid to get the loan from the Society.', col1, currentY)
    currentY += 12
    doc.text(`   1. Membership Fee Rs. ${fees.membership.amount}. (Non Refundable) - One Time payment`, col1 + 10, currentY)
    currentY += 10
    doc.text(`   2. Share Capital Rs. ${fees.shareCapital.amount}. (Refundable without Interest) - One Time payment.`, col1 + 10, currentY)
    currentY += 10
    doc.text(`   3. Monthly Savings of Rs. ${loan.schedule[0]?.monthlySavings || 200} per month. (Refundable after clearing total loan with`, col1 + 10, currentY)
    currentY += 10
    doc.text('      6% interest) - Monthly Payment.', col1 + 10, currentY)
    currentY += 10
    doc.text(`   4. ${processingFee/loan.loanAmount*100}% Processing Fee at the time of disbursement of loan on loan amount. (Non`, col1 + 10, currentY)
    currentY += 10
    doc.text('      Refundable) - One time payment at the time of loan only.', col1 + 10, currentY)
    currentY += 10
    doc.text(`   5. If any payment fail in any month will attract fine of Rs.${loan.lateFeeAmount || 1000} per failure.`, col1 + 10, currentY)
    currentY += 12
    doc.text('3. The following documents should be present to join as member.', col1, currentY)
    currentY += 12
    doc.text('   1. Latest copy of Aadhaar', col1 + 10, currentY)
    currentY += 10
    doc.text('   2. Latest copy of PAN', col1 + 10, currentY)
    currentY += 10
    doc.text('   3. 3 Photos', col1 + 10, currentY)
    currentY += 10
    doc.text('   4. Two cheque leafs', col1 + 10, currentY)
    currentY += 12
    doc.text('4. For every payment to society, member should get compulsary receipt from the society.', col1, currentY)
    currentY += 12
    doc.text('5. For Every Six months once, member should check and confirm the balance of loan and savings with', col1, currentY)
    currentY += 10
    doc.text('   society.', col1, currentY)
  }

  formatDate(dateString) {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}-${month}-${year}`
  }

  // Helper function to format numbers without unwanted prefixes
  formatNumber(amount) {
    const numValue = parseFloat(amount || 0)
    return numValue.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  // Helper function to format currency
  formatCurrency(amount) {
    const numValue = parseFloat(amount || 0)
    const formatted = numValue.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    return `Rs. ${formatted}`
  }
}

export { ScheduleService }