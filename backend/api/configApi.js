import express from 'express'
import { configService } from '../services/configService.js'

const router = express.Router()

// Get full configuration
router.get('/', (req, res) => {
  try {
    const config = configService.getFullConfig()
    res.json(config)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get society information
router.get('/society', (req, res) => {
  try {
    const society = configService.getSociety()
    res.json(society)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get UI configuration
router.get('/ui', (req, res) => {
  try {
    const ui = configService.getUIConfig()
    res.json(ui)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get fees configuration
router.get('/fees', (req, res) => {
  try {
    const fees = configService.getFees()
    res.json(fees)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get loan configuration
router.get('/loan', (req, res) => {
  try {
    const loan = configService.getLoanConfig()
    res.json(loan)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get member configuration
router.get('/member', (req, res) => {
  try {
    const member = configService.getMemberConfig()
    res.json(member)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Calculate processing fee for loan amount
router.get('/processing-fee/:amount', (req, res) => {
  try {
    const amount = parseInt(req.params.amount)
    const fee = configService.getProcessingFee(amount)
    res.json({ amount, fee })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get interest rate for loan amount
router.get('/interest-rate/:amount', (req, res) => {
  try {
    const amount = parseInt(req.params.amount)
    const rate = configService.getInterestRate(amount)
    res.json({ amount, rate })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update configuration
router.put('/', (req, res) => {
  try {
    // In a real implementation, this would update the config file or database
    // For now, just return success (config is read-only from file)
    res.json({ 
      message: 'Configuration update received',
      note: 'Config updates require server restart to take effect'
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router