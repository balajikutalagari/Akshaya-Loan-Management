import express from 'express'
import cors from 'cors'
import { configService } from '../services/configService.js'

// Import database
import { initializeDatabase } from '../db/index.js'

// Import API routes
import configApi from './configApi.js'
import memberApi from './memberApi.js'
import loanApi from './loanApi.js'
import paymentApi from './paymentApi.js'
import savingsApi from './savingsApi.js'
import dashboardApi from './dashboardApi.js'
import reportApi from './reportApi.js'
import reminderApi from './reminderApi.js'
import { createReceiptRoutes } from './receipts.js'

const app = express()

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', /pear:\/\/.*/, /localhost:.*/, '*'],
  credentials: true
}))
app.use(express.json())

// Initialize database and make it available to routes
let db
app.use(async (req, res, next) => {
  if (!db) {
    try {
      console.log('Initializing database...')
      db = await initializeDatabase()
      console.log('Database initialized successfully')
    } catch (error) {
      console.error('Database initialization failed:', error)
      return res.status(500).json({ error: 'Database initialization failed' })
    }
  }
  req.db = db
  next()
})

// API Routes
app.use('/api/config', configApi)
app.use('/api/members', memberApi) 
app.use('/api/loans', loanApi)
app.use('/api/payments', paymentApi)
app.use('/api/savings', savingsApi)
app.use('/api/dashboard', dashboardApi)
app.use('/api/reports', reportApi)
app.use('/api/reminders', reminderApi)

// Receipt routes
const receiptRoutes = createReceiptRoutes()
app.use('/api/receipts', receiptRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Root endpoint
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Akshaya Loan Management API',
    version: '1.0.0',
    endpoints: {
      config: '/api/config',
      members: '/api/members',
      loans: '/api/loans', 
      payments: '/api/payments',
      savings: '/api/savings',
      dashboard: '/api/dashboard',
      reports: '/api/reports',
      reminders: '/api/reminders',
      receipts: '/api/receipts'
    }
  })
})

// Export the Express app
export default app