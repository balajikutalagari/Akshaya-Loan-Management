import express from 'express'
import { MemberModel } from '../models/member.js'

const router = express.Router()

// Get all members
router.get('/', async (req, res) => {
  try {
    const memberModel = new MemberModel(req.db)
    const { limit = 50, offset = 0, status } = req.query
    
    let members = await memberModel.findAll({ limit: parseInt(limit), offset: parseInt(offset) })
    
    if (status) {
      members = members.filter(m => m.status === status)
    }
    
    res.json(members)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Search members
router.get('/search', async (req, res) => {
  try {
    const memberModel = new MemberModel(req.db)
    const { q } = req.query
    
    if (!q) {
      return res.status(400).json({ error: 'Search query required' })
    }
    
    const results = await memberModel.search(q)
    res.json(results)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get member stats
router.get('/stats', async (req, res) => {
  try {
    const memberModel = new MemberModel(req.db)
    const stats = await memberModel.getStats()
    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get member by ID
router.get('/:id', async (req, res) => {
  try {
    const memberModel = new MemberModel(req.db)
    const member = await memberModel.findById(req.params.id)
    
    if (!member) {
      return res.status(404).json({ error: 'Member not found' })
    }
    
    res.json(member)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get member by member ID
router.get('/by-member-id/:memberId', async (req, res) => {
  try {
    const memberModel = new MemberModel(req.db)
    const member = await memberModel.findByMemberId(req.params.memberId)
    
    if (!member) {
      return res.status(404).json({ error: 'Member not found' })
    }
    
    res.json(member)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create new member
router.post('/', async (req, res) => {
  try {
    const memberModel = new MemberModel(req.db)
    
    // Validate required fields
    const requiredFields = memberModel.memberConfig.requiredFields
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ error: `${field} is required` })
      }
    }
    
    const member = await memberModel.create(req.body)
    res.status(201).json(member)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update member
router.put('/:id', async (req, res) => {
  try {
    const memberModel = new MemberModel(req.db)
    const member = await memberModel.update(req.params.id, req.body)
    res.json(member)
  } catch (error) {
    if (error.message === 'Record not found') {
      return res.status(404).json({ error: 'Member not found' })
    }
    res.status(500).json({ error: error.message })
  }
})

// Delete member
router.delete('/:id', async (req, res) => {
  try {
    const memberModel = new MemberModel(req.db)
    await memberModel.delete(req.params.id)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router