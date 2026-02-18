import React, { useState, useEffect } from 'react'
import { Bell, AlertTriangle, Clock, CheckCircle, X, Plus, Eye } from 'lucide-react'
import { api } from '../api/client'

export function RemindersPage() {
  const [reminders, setReminders] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newReminder, setNewReminder] = useState({
    title: '',
    message: '',
    type: 'manual',
    priority: 'medium',
    dueDate: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    loadReminders()
    loadStats()
  }, [filter])

  const loadReminders = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/reminders?status=${filter}`)
      const data = await response.json()
      setReminders(data)
    } catch (err) {
      setError('Failed to load reminders')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/reminders/stats')
      const data = await response.json()
      setStats(data)
    } catch (err) {
      console.error('Failed to load reminder stats:', err)
    }
  }

  const handleMarkAsRead = async (reminderId) => {
    try {
      await fetch(`/api/reminders/${reminderId}/read`, { method: 'POST' })
      loadReminders()
      loadStats()
    } catch (err) {
      console.error('Failed to mark reminder as read:', err)
    }
  }

  const handleDismiss = async (reminderId) => {
    try {
      await fetch(`/api/reminders/${reminderId}/dismiss`, { method: 'POST' })
      loadReminders()
      loadStats()
    } catch (err) {
      console.error('Failed to dismiss reminder:', err)
    }
  }

  const handleCreateReminder = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReminder)
      })
      
      if (response.ok) {
        setShowCreateForm(false)
        setNewReminder({
          title: '',
          message: '',
          type: 'manual',
          priority: 'medium',
          dueDate: new Date().toISOString().split('T')[0]
        })
        loadReminders()
        loadStats()
      }
    } catch (err) {
      console.error('Failed to create reminder:', err)
    }
  }

  const generatePaymentReminders = async () => {
    try {
      const response = await fetch('/api/reminders/generate/payments', { method: 'POST' })
      const data = await response.json()
      alert(data.message)
      loadReminders()
      loadStats()
    } catch (err) {
      console.error('Failed to generate payment reminders:', err)
    }
  }

  const generateOverdueReminders = async () => {
    try {
      const response = await fetch('/api/reminders/generate/overdue', { method: 'POST' })
      const data = await response.json()
      alert(data.message)
      loadReminders()
      loadStats()
    } catch (err) {
      console.error('Failed to generate overdue reminders:', err)
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return <AlertTriangle size={16} />
      case 'medium': return <Clock size={16} />
      case 'low': return <Bell size={16} />
      default: return <Bell size={16} />
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'payment_due': return '💳'
      case 'payment_overdue': return '⚠️'
      case 'manual': return '📝'
      default: return '📢'
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="h-8 w-8 text-green-600" />
            Reminders
          </h1>
          <p className="text-gray-600 mt-1">Manage payment reminders and notifications</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
          >
            <Plus size={16} />
            New Reminder
          </button>
          <button
            onClick={generatePaymentReminders}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Generate Payment Reminders
          </button>
          <button
            onClick={generateOverdueReminders}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Generate Overdue Reminders
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <Bell className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <Eye className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Unread</p>
              <p className="text-2xl font-bold text-gray-900">{stats.unread || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">High Priority</p>
              <p className="text-2xl font-bold text-gray-900">{stats.high || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Medium Priority</p>
              <p className="text-2xl font-bold text-gray-900">{stats.medium || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <Bell className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Low Priority</p>
              <p className="text-2xl font-bold text-gray-900">{stats.low || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { key: 'all', label: 'All Reminders' },
              { key: 'active', label: 'Active' },
              { key: 'dismissed', label: 'Dismissed' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  filter === tab.key
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Reminders List */}
      <div className="space-y-4">
        {reminders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">No reminders found</p>
          </div>
        ) : (
          reminders.map((reminder) => (
            <div key={reminder.id} className={`bg-white rounded-lg shadow p-6 border-l-4 ${
              reminder.priority === 'high' ? 'border-red-500' :
              reminder.priority === 'medium' ? 'border-yellow-500' : 'border-blue-500'
            } ${!reminder.isRead ? 'ring-2 ring-green-100' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <span className="text-2xl">{getTypeIcon(reminder.type)}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{reminder.title}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(reminder.priority)}`}>
                        {getPriorityIcon(reminder.priority)}
                        {reminder.priority}
                      </span>
                      {!reminder.isRead && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-3">{reminder.message}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      {reminder.memberName && (
                        <span>Member: {reminder.memberName}</span>
                      )}
                      {reminder.amount && (
                        <span>Amount: ₹{reminder.amount}</span>
                      )}
                      {reminder.dueDate && (
                        <span>Due: {new Date(reminder.dueDate).toLocaleDateString()}</span>
                      )}
                      <span>Created: {new Date(reminder.createdDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {!reminder.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(reminder.id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Mark as read"
                    >
                      <CheckCircle size={20} />
                    </button>
                  )}
                  {reminder.status === 'active' && (
                    <button
                      onClick={() => handleDismiss(reminder.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Dismiss"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Reminder Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Reminder</h2>
            <form onSubmit={handleCreateReminder}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={newReminder.title}
                    onChange={(e) => setNewReminder({...newReminder, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea
                    value={newReminder.message}
                    onChange={(e) => setNewReminder({...newReminder, message: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={3}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select
                      value={newReminder.priority}
                      onChange={(e) => setNewReminder({...newReminder, priority: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                    <input
                      type="date"
                      value={newReminder.dueDate}
                      onChange={(e) => setNewReminder({...newReminder, dueDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Create Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}