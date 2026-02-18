import express from 'express'
import { ReminderModel } from '../models/reminder.js'
import { MemberModel } from '../models/member.js'

const router = express.Router()

// Get all reminders
router.get('/', async (req, res) => {
  try {
    const reminderModel = new ReminderModel(req.db)
    const { limit = 50, offset = 0, type, memberId, status = 'active' } = req.query
    
    let reminders = await reminderModel.findAll({ limit: parseInt(limit), offset: parseInt(offset) })
    
    // Filter by type if specified
    if (type) {
      reminders = reminders.filter(r => r.type === type)
    }
    
    // Filter by member if specified
    if (memberId) {
      reminders = reminders.filter(r => r.memberId === memberId)
    }
    
    // Filter by status
    if (status !== 'all') {
      reminders = reminders.filter(r => r.status === status)
    }
    
    // Sort by creation date (newest first)
    reminders.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate))
    
    res.json(reminders)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get reminder by ID
router.get('/:id', async (req, res) => {
  try {
    const reminderModel = new ReminderModel(req.db)
    const reminder = await reminderModel.findById(req.params.id)
    
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' })
    }
    
    res.json(reminder)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get reminders by type
router.get('/type/:type', async (req, res) => {
  try {
    const reminderModel = new ReminderModel(req.db)
    const reminders = await reminderModel.findByType(req.params.type)
    res.json(reminders)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get reminders by member
router.get('/member/:memberId', async (req, res) => {
  try {
    const reminderModel = new ReminderModel(req.db)
    const reminders = await reminderModel.findByMember(req.params.memberId)
    res.json(reminders)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get pending reminders
router.get('/status/pending', async (req, res) => {
  try {
    const reminderModel = new ReminderModel(req.db)
    const reminders = await reminderModel.findPending()
    res.json(reminders)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get reminder statistics
router.get('/stats', async (req, res) => {
  try {
    const reminderModel = new ReminderModel(req.db)
    const stats = await reminderModel.getStats()
    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create new reminder
router.post('/', async (req, res) => {
  try {
    const reminderModel = new ReminderModel(req.db)
    const memberModel = new MemberModel(req.db)
    
    // Validate member if memberId is provided
    if (req.body.memberId) {
      const member = await memberModel.findById(req.body.memberId)
      if (!member) {
        return res.status(404).json({ error: 'Member not found' })
      }
    }
    
    const reminder = await reminderModel.create(req.body)
    res.status(201).json(reminder)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Mark reminder as read
router.post('/:id/read', async (req, res) => {
  try {
    const reminderModel = new ReminderModel(req.db)
    const reminder = await reminderModel.markAsRead(req.params.id)
    res.json(reminder)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Dismiss reminder
router.post('/:id/dismiss', async (req, res) => {
  try {
    const reminderModel = new ReminderModel(req.db)
    const reminder = await reminderModel.dismiss(req.params.id)
    res.json(reminder)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Generate payment reminders
router.post('/generate/payments', async (req, res) => {
  try {
    const reminderModel = new ReminderModel(req.db)
    const reminders = await reminderModel.generatePaymentReminders()
    res.json({ 
      message: `Generated ${reminders.length} payment reminders`,
      reminders 
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Generate overdue reminders
router.post('/generate/overdue', async (req, res) => {
  try {
    const reminderModel = new ReminderModel(req.db)
    const reminders = await reminderModel.generateOverdueReminders()
    res.json({ 
      message: `Generated ${reminders.length} overdue reminders`,
      reminders 
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update reminder
router.put('/:id', async (req, res) => {
  try {
    const reminderModel = new ReminderModel(req.db)
    const reminder = await reminderModel.update(req.params.id, req.body)
    res.json(reminder)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete reminder
router.delete('/:id', async (req, res) => {
  try {
    const reminderModel = new ReminderModel(req.db)
    await reminderModel.delete(req.params.id)
    res.json({ message: 'Reminder deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router