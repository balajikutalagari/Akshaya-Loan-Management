/**
 * SOCIETY CONFIGURATION
 * 
 * This is the single source of truth for all society-specific settings.
 * To adapt this app for a different society, only modify this file.
 */

export default {
  // ============================================
  // SOCIETY INFORMATION
  // ============================================
  society: {
    id: "sai-akshaya",
    name: "Sri Sai Akshaya Mutually Aided Cooperative Thrift & Credit Society Ltd.",
    shortName: "Sai Akshaya",
    registrationNumber: "REG/2020/SAI001",
    
    // Contact details
    contact: {
      phone: "+91 9876543210",
      email: "info@saiakshaya.coop",
      website: "https://saiakshaya.coop"
    },
    
    // Address
    address: {
      line1: "123, Main Road",
      line2: "Near SBI Bank",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500001",
      country: "India"
    },
    
    // Branding
    logo: "/assets/logo.png",
    favicon: "/assets/favicon.ico",
    
    // Locale
    locale: "en-IN",
    currency: "INR",
    currencySymbol: "₹",
    dateFormat: "DD-MM-YYYY",
    financialYearStart: 4, // April (1-12)
  },

  // ============================================
  // FEE STRUCTURE
  // ============================================
  fees: {
    membership: {
      amount: 200,
      label: "Membership Fee",
      refundable: false,
      oneTime: true,
      mandatory: true,
      description: "One-time non-refundable membership fee"
    },
    
    shareCapital: {
      amount: 6000,
      label: "Share Capital",
      refundable: true,
      refundWithInterest: false,
      oneTime: true,
      mandatory: true,
      description: "Refundable without interest on membership termination"
    },
    
    processingFee: {
      type: "percentage", // "percentage" | "fixed"
      value: 1, // 1% of loan amount
      label: "Processing Fee",
      refundable: false,
      chargeOn: "disbursement", // "disbursement" | "approval"
      minAmount: 500,
      maxAmount: null,
      description: "1% of loan amount, non-refundable"
    },
    
    lateFee: {
      type: "fixed", // "percentage" | "fixed"
      value: 1000,
      label: "Late Payment Fee",
      applyAfterDays: 0, // Apply immediately after due date
      maxOccurrences: null, // null = unlimited
      description: "Rs.1000 per missed/late payment"
    },
    
    prepaymentPenalty: {
      enabled: false,
      type: "percentage",
      value: 2,
      label: "Prepayment Penalty",
      waiveAfterMonths: 6, // No penalty after 6 months
      description: "2% of outstanding if closed before 6 months"
    },
    
    // Add more fees as needed
    documentationFee: {
      enabled: false,
      amount: 200,
      label: "Documentation Fee",
      refundable: false
    }
  },

  // ============================================
  // SAVINGS CONFIGURATION
  // ============================================
  savings: {
    enabled: true,
    label: "Monthly Savings",
    
    mandatory: true,
    mandatoryWithLoan: true, // Required when loan is active
    
    defaultAmount: 200,
    minAmount: 100,
    maxAmount: 10000,
    
    // Interest on savings
    interest: {
      enabled: true,
      ratePerAnnum: 6, // 6% per annum
      calculationFrequency: "monthly", // "monthly" | "quarterly" | "yearly"
      compounding: true,
      payoutOn: "loanClosure", // "loanClosure" | "yearly" | "onDemand"
    },
    
    // Withdrawal rules
    withdrawal: {
      allowedDuringLoan: false,
      minBalanceRequired: 0,
      noticePeriodDays: 0,
    },
    
    description: "Monthly savings with 6% annual interest, refundable after loan closure"
  },

  // ============================================
  // LOAN CONFIGURATION
  // ============================================
  loan: {
    // Amount limits
    minAmount: 50000,
    maxAmount: 10000000, // 1 Crore
    amountStep: 10000, // Increment steps
    
    // Tenure options
    tenure: {
      minMonths: 6,
      maxMonths: 60,
      defaultMonths: 20,
      // Quick select presets
      presets: [
        { months: 12, label: "12 Months", popular: false },
        { months: 18, label: "18 Months", popular: false },
        { months: 20, label: "20 Months", popular: true },
        { months: 24, label: "24 Months", popular: true },
        { months: 30, label: "30 Months", popular: false },
        { months: 36, label: "36 Months", popular: false },
      ],
      allowCustom: true,
    },
    
    // Interest configuration
    interest: {
      type: "reducingBalance", // "reducingBalance" | "flatRate"
      rateType: "monthly", // "monthly" | "annual"
      defaultRate: 1.5, // 1.5% per month
      
      // Rate slabs (optional - if empty, use defaultRate)
      slabs: [
        { minAmount: 0, maxAmount: 500000, rate: 2.0 },
        { minAmount: 500001, maxAmount: 2000000, rate: 1.5 },
        { minAmount: 2000001, maxAmount: null, rate: 1.5 },
      ],
      
      // Grace period before interest starts
      gracePeriodDays: 0,
    },
    
    // EMI configuration
    emi: {
      // Due date options
      dueDateOptions: [1, 3, 5, 7, 10, 15, 20, 25], // Available due dates
      defaultDueDate: 3,
      
      // Components included in EMI
      components: {
        principal: true,
        interest: true,
        savings: true, // Include savings in EMI
      },
    },
    
    // Disbursement
    disbursement: {
      modes: ["cash", "cheque", "bankTransfer", "upi"],
      defaultMode: "bankTransfer",
      requireBankDetails: true,
    },
    
    // Approval workflow
    approval: {
      requiresApproval: false, // Set true if multi-level approval needed
      approvalLevels: 1,
    },
  },

  // ============================================
  // PAYMENT CONFIGURATION
  // ============================================
  payment: {
    modes: [
      { id: "cash", label: "Cash", enabled: true, requiresReference: false },
      { id: "cheque", label: "Cheque", enabled: true, requiresReference: true },
      { id: "upi", label: "UPI", enabled: true, requiresReference: true },
      { id: "bankTransfer", label: "Bank Transfer", enabled: true, requiresReference: true },
      { id: "online", label: "Online Payment", enabled: false, requiresReference: true },
    ],
    
    // Partial payment
    allowPartialPayment: true,
    minPartialAmount: 1000,
    
    // Advance payment
    allowAdvancePayment: true,
    maxAdvanceEmis: 3,
    
    // Receipt
    receipt: {
      autoGenerate: true,
      prefix: "REC",
      format: "{prefix}-{year}-{sequence}", // REC-2025-00001
    },
  },

  // ============================================
  // MEMBER CONFIGURATION
  // ============================================
  member: {
    // ID format
    idFormat: {
      prefix: "MEM",
      format: "{prefix}-{sequence}", // MEM-00001
      sequenceLength: 5,
    },
    
    // Required fields
    requiredFields: [
      "name",
      "phone",
      "address",
    ],
    
    // Optional fields
    optionalFields: [
      "email",
      "alternatePhone",
      "occupation",
      "monthlyIncome",
      "referredBy",
    ],
    
    // Document requirements
    documents: {
      required: [
        { 
          id: "aadhaar", 
          label: "Aadhaar Card", 
          accept: ".pdf,.jpg,.jpeg,.png",
          maxSize: 5 * 1024 * 1024 // 5MB
        },
        { 
          id: "pan", 
          label: "PAN Card", 
          accept: ".pdf,.jpg,.jpeg,.png",
          maxSize: 5 * 1024 * 1024 
        },
        { 
          id: "photo", 
          label: "Passport Photo", 
          accept: ".jpg,.jpeg,.png",
          maxSize: 2 * 1024 * 1024,
          count: 3 // Number required
        },
      ],
      optional: [
        { 
          id: "chequeLeaf", 
          label: "Cancelled Cheque", 
          accept: ".pdf,.jpg,.jpeg,.png",
          maxSize: 5 * 1024 * 1024,
          count: 2
        },
        { 
          id: "incomeProof", 
          label: "Income Proof", 
          accept: ".pdf,.jpg,.jpeg,.png",
          maxSize: 5 * 1024 * 1024 
        },
        { 
          id: "addressProof", 
          label: "Address Proof", 
          accept: ".pdf,.jpg,.jpeg,.png",
          maxSize: 5 * 1024 * 1024 
        },
      ],
    },
    
    // Guarantor requirements
    guarantor: {
      required: false,
      minGuarantors: 1,
      maxGuarantors: 2,
      canBeMember: true, // Existing member can be guarantor
    },
  },

  // ============================================
  // REMINDER CONFIGURATION
  // ============================================
  reminders: {
    enabled: true,
    
    // Schedule
    schedule: [
      { daysBefore: 3, type: "upcoming", label: "3 Days Before" },
      { daysBefore: 1, type: "upcoming", label: "1 Day Before" },
      { daysBefore: 0, type: "dueDate", label: "On Due Date" },
      { daysAfter: 1, type: "overdue", label: "1 Day Overdue" },
      { daysAfter: 7, type: "overdue", label: "1 Week Overdue" },
    ],
    
    // Channels
    channels: {
      whatsapp: {
        enabled: true,
        templates: {
          upcoming: "Dear {memberName}, Your EMI of {currency}{amount} is due on {dueDate}. Please pay on time. - {societyShortName}",
          dueDate: "Reminder: Today is your EMI due date. Amount: {currency}{amount}. Please pay today. - {societyShortName}",
          overdue: "OVERDUE: Your EMI of {currency}{amount} (due {dueDate}) is pending. Late fee of {currency}{lateFee} applies. - {societyShortName}",
        },
      },
      sms: {
        enabled: false,
        templates: {
          // Same structure as whatsapp
        },
      },
      email: {
        enabled: false,
        templates: {
          // Same structure
        },
      },
    },
  },

  // ============================================
  // REPORTS CONFIGURATION
  // ============================================
  reports: {
    available: [
      { id: "collection", label: "Collection Report", enabled: true },
      { id: "outstanding", label: "Outstanding Report", enabled: true },
      { id: "disbursement", label: "Disbursement Report", enabled: true },
      { id: "overdue", label: "Overdue Report", enabled: true },
      { id: "savings", label: "Savings Report", enabled: true },
      { id: "memberList", label: "Member List", enabled: true },
      { id: "loanList", label: "Loan List", enabled: true },
      { id: "interestIncome", label: "Interest Income Report", enabled: true },
    ],
    
    // Export formats
    exportFormats: ["pdf", "excel", "csv"],
    
    // Default date range
    defaultDateRange: "currentMonth", // "today" | "currentMonth" | "currentFY"
  },

  // ============================================
  // UI CONFIGURATION
  // ============================================
  ui: {
    // Theme
    theme: {
      primaryColor: "#16a34a", // Green-600
      secondaryColor: "#ca8a04", // Yellow-600
      accentColor: "#2563eb", // Blue-600
      dangerColor: "#dc2626", // Red-600
      
      // Header/Sidebar
      headerBg: "#16a34a",
      sidebarBg: "#1f2937", // Gray-800
      
      // Logo display
      showLogoInHeader: true,
      showLogoInSidebar: false,
    },
    
    // Dashboard widgets
    dashboard: {
      widgets: [
        { id: "dueCalendar", label: "Due Calendar", enabled: true, order: 1 },
        { id: "stats", label: "Statistics", enabled: true, order: 2 },
        { id: "overdueAlerts", label: "Overdue Alerts", enabled: true, order: 3 },
        { id: "recentTransactions", label: "Recent Transactions", enabled: true, order: 4 },
        { id: "quickActions", label: "Quick Actions", enabled: true, order: 5 },
      ],
    },
    
    // Navigation
    navigation: [
      { id: "dashboard", label: "Dashboard", icon: "Home", path: "/", enabled: true },
      { id: "members", label: "Members", icon: "Users", path: "/members", enabled: true },
      { id: "loans", label: "Loans", icon: "Briefcase", path: "/loans", enabled: true },
      { id: "payments", label: "Payments", icon: "CreditCard", path: "/payments", enabled: true },
      { id: "receipts", label: "Receipts", icon: "FileText", path: "/receipts", enabled: true },
      { id: "savings", label: "Savings", icon: "PiggyBank", path: "/savings", enabled: true },
      { id: "reminders", label: "Reminders", icon: "Bell", path: "/reminders", enabled: true },
      { id: "reports", label: "Reports", icon: "BarChart", path: "/reports", enabled: true },
      { id: "settings", label: "Settings", icon: "Settings", path: "/settings", enabled: true },
    ],
    
    // Date display
    dateDisplay: {
      format: "DD-MM-YYYY",
      showRelative: true, // "2 days ago"
    },
    
    // Currency display
    currencyDisplay: {
      symbol: "₹",
      symbolPosition: "before", // "before" | "after"
      thousandSeparator: ",",
      decimalSeparator: ".",
      decimalPlaces: 0, // No decimals for INR
      format: "indian", // "indian" (12,34,567) | "international" (1,234,567)
    },
    
    // Table settings
    table: {
      defaultPageSize: 20,
      pageSizeOptions: [10, 20, 50, 100],
      showRowNumbers: true,
    },
  },

  // ============================================
  // RECEIPT/PRINT TEMPLATES
  // ============================================
  templates: {
    receipt: {
      header: {
        showLogo: true,
        showSocietyName: true,
        showAddress: true,
        showPhone: true,
        showRegistration: true,
      },
      body: {
        title: "PAYMENT RECEIPT",
        fields: [
          { label: "Receipt No", field: "receiptNumber" },
          { label: "Date", field: "paymentDate" },
          { label: "Member Name", field: "memberName" },
          { label: "Member ID", field: "memberId" },
          { label: "Loan ID", field: "loanId" },
          { label: "EMI No", field: "emiNumber" },
          { label: "Amount Paid", field: "amount", format: "currency" },
          { label: "Payment Mode", field: "paymentMode" },
          { label: "Reference No", field: "referenceNumber" },
        ],
        breakdown: {
          show: true,
          fields: [
            { label: "Principal", field: "principal" },
            { label: "Interest", field: "interest" },
            { label: "Savings", field: "savings" },
            { label: "Late Fee", field: "lateFee" },
          ],
        },
      },
      footer: {
        showSignature: true,
        signatureLabel: "Authorized Signatory",
        notes: "This is a computer-generated receipt.",
        showThankYou: true,
        thankYouMessage: "Thank you for your payment!",
      },
    },
    
    loanSchedule: {
      header: {
        showLogo: true,
        showSocietyName: true,
        title: "LOAN REPAYMENT SCHEDULE",
      },
      columns: [
        { label: "S.No.", field: "emiNumber" },
        { label: "Due Date", field: "dueDate", format: "date" },
        { label: "Opening Balance", field: "openingBalance", format: "currency" },
        { label: "Interest", field: "monthlyInterest", format: "currency" },
        { label: "Principal", field: "monthlyPrincipal", format: "currency" },
        { label: "Closing Balance", field: "closingBalance", format: "currency" },
        { label: "Savings", field: "monthlySavings", format: "currency" },
        { label: "Total EMI", field: "totalPayment", format: "currency" },
      ],
    },
  },

  // ============================================
  // VALIDATION RULES
  // ============================================
  validation: {
    phone: {
      pattern: "^[6-9]\\d{9}$", // Indian mobile
      message: "Please enter a valid 10-digit mobile number",
    },
    aadhaar: {
      pattern: "^\\d{12}$",
      message: "Please enter a valid 12-digit Aadhaar number",
      mask: true, // Show only last 4 digits
    },
    pan: {
      pattern: "^[A-Z]{5}[0-9]{4}[A-Z]{1}$",
      message: "Please enter a valid PAN number",
    },
    pincode: {
      pattern: "^\\d{6}$",
      message: "Please enter a valid 6-digit pincode",
    },
    email: {
      pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
      message: "Please enter a valid email address",
    },
  },

  // ============================================
  // BUSINESS RULES
  // ============================================
  rules: {
    // Loan eligibility
    eligibility: {
      minMembershipDays: 0, // Days after joining before eligible for loan
      maxActiveLoans: 1, // Max concurrent loans per member
      minGapBetweenLoans: 0, // Days between loan closure and new loan
      checkCreditScore: false,
    },
    
    // Balance verification
    verification: {
      enabled: true,
      frequencyMonths: 6, // Every 6 months
      reminderDaysBefore: 7,
      message: "Please visit the office to verify your loan and savings balance.",
    },
    
    // Closure rules
    closure: {
      allowPrepayment: true,
      allowPartialPrepayment: true,
      minPrepaymentAmount: 10000,
      refundSavingsOnClosure: true,
      refundShareCapitalOnClosure: false, // Only on membership termination
    },
  },

  // ============================================
  // SYSTEM CONFIGURATION
  // ============================================
  system: {
    // Database
    database: {
      name: "akshaya-db",
      storagePath: "./storage",
    },
    
    // Backup
    backup: {
      autoBackup: true,
      frequency: "daily", // "daily" | "weekly"
      retentionDays: 30,
      backupPath: "./backups",
    },
    
    // P2P Sync
    sync: {
      enabled: false,
      autoSync: true,
      syncInterval: 300000, // 5 minutes
    },
    
    // Jobs
    jobs: {
      savingsInterest: {
        enabled: true,
        schedule: "monthEnd", // "monthEnd" | "daily"
      },
      overdueChecker: {
        enabled: true,
        schedule: "daily",
        runAtHour: 0, // Midnight
      },
      reminderSender: {
        enabled: true,
        schedule: "daily",
        runAtHour: 9, // 9 AM
      },
    },
    
    // Logging
    logging: {
      level: "info", // "debug" | "info" | "warn" | "error"
      logToFile: true,
      logPath: "./logs",
    },
  },
}