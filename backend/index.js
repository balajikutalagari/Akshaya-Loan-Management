import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { configService } from './services/configService.js'

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Import database
import { initializeDatabase } from './db/index.js'

// Import API routes
import configApi from './api/configApi.js'
import memberApi from './api/memberApi.js'
import loanApi from './api/loanApi.js'
import paymentApi from './api/paymentApi.js'
import savingsApi from './api/savingsApi.js'
import dashboardApi from './api/dashboardApi.js'
import reportApi from './api/reportApi.js'
import reminderApi from './api/reminderApi.js'
import { createReceiptRoutes } from './api/receipts.js'

// Import job scheduler
import { startJobs } from './jobs/index.js'

async function startServer() {
  try {
    // Initialize database
    console.log('Initializing database...')
    const db = await initializeDatabase()
    console.log('Database initialized successfully')

    // Create Express app
    const app = express()
    const PORT = process.env.PORT || 3001

    // Middleware
    app.use(cors())
    app.use(express.json())
    app.use(express.static(path.join(__dirname, '../frontend/dist')))

    // Make db available to routes
    app.use((req, res, next) => {
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
    app.use('/api/receipts', createReceiptRoutes(db))

    // Serve frontend for all other routes
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../frontend/dist/index.html'))
    })

    // Error handling
    app.use((err, req, res, next) => {
      console.error('Server error:', err)
      res.status(500).json({ 
        error: 'Internal server error',
        message: err.message 
      })
    })

    // Start server
    app.listen(PORT, () => {
      console.log(`✅ Akshaya Loan Management Server running on port ${PORT}`)
      console.log(`Society: ${configService.getSocietyName()}`)
    })

    // Start background jobs
    if (configService.config.system.jobs) {
      console.log('Starting background jobs...')
      startJobs(db)
    }

  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\nShutting down server...')
  process.exit(0)
})

// Start the server
startServer()