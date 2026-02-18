import express from 'express'
import { SavingsModel } from '../models/savings.js'
import { MemberModel } from '../models/member.js'

const router = express.Router()

// Get all savings accounts
router.get('/', async (req, res) => {
  try {
    const savingsModel = new SavingsModel(req.db)
    const memberModel = new MemberModel(req.db)
    const { limit = 50, offset = 0, memberId, status = 'active' } = req.query
    
    let savings = await savingsModel.findAll({ limit: parseInt(limit), offset: parseInt(offset) })
    
    // Filter by member if specified
    if (memberId) {
      savings = savings.filter(s => s.memberId === memberId)
    }
    
    // Filter by status
    if (status !== 'all') {
      savings = savings.filter(s => s.status === status)
    }
    
    // Enrich with member details
    for (const saving of savings) {
      if (saving.memberId) {
        const member = await memberModel.findById(saving.memberId)
        if (member) {
          saving.memberName = member.name
          saving.memberPhone = member.phone
        }
      }
    }
    
    res.json(savings)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get savings account by ID
router.get('/:id', async (req, res) => {
  try {
    const savingsModel = new SavingsModel(req.db)
    const savings = await savingsModel.findById(req.params.id)
    
    if (!savings) {
      return res.status(404).json({ error: 'Savings account not found' })
    }
    
    res.json(savings)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get savings by member ID
router.get('/member/:memberId', async (req, res) => {
  try {
    const savingsModel = new SavingsModel(req.db)
    const savings = await savingsModel.findByMember(req.params.memberId)
    res.json(savings)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Calculate interest for a savings account
router.get('/interest/:id', async (req, res) => {
  try {
    const savingsModel = new SavingsModel(req.db)
    const result = await savingsModel.calculateInterest(req.params.id)
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get savings statistics
router.get('/stats', async (req, res) => {
  try {
    const savingsModel = new SavingsModel(req.db)
    const stats = await savingsModel.getStats()
    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create new savings account
router.post('/', async (req, res) => {
  try {
    const savingsModel = new SavingsModel(req.db)
    const memberModel = new MemberModel(req.db)
    
    // Validate member exists
    const member = await memberModel.findById(req.body.memberId)
    if (!member) {
      return res.status(404).json({ error: 'Member not found' })
    }
    
    const savings = await savingsModel.create(req.body)
    res.status(201).json(savings)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update savings balance (deposit/withdrawal)
router.post('/:id/transaction', async (req, res) => {
  try {
    const savingsModel = new SavingsModel(req.db)
    const { amount, type } = req.body
    
    if (!amount || !type) {
      return res.status(400).json({ error: 'Amount and transaction type are required' })
    }
    
    if (type !== 'deposit' && type !== 'withdrawal') {
      return res.status(400).json({ error: 'Transaction type must be deposit or withdrawal' })
    }
    
    const updated = await savingsModel.updateBalance(req.params.id, amount, type)
    res.json(updated)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router