import React, { useState, useEffect } from 'react'
import { useConfig } from '../context/ConfigContext'
import { DashboardWidgets } from '../components/dashboard/DashboardWidgets'
import { api } from '../api/client'

export function Dashboard() {
  const { societyName } = useConfig()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Loading dashboard data...')
      const data = await api.dashboard.stats()
      console.log('Dashboard data loaded:', data)
      setStats(data)
    } catch (err) {
      console.error('Dashboard error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-medium">Error loading dashboard</h3>
        <p className="text-red-600 text-sm mt-1">{error}</p>
        <button 
          onClick={loadDashboardData}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-8 mb-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening at {societyName}</p>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-6">
        {/* Dashboard Widgets */}
        <DashboardWidgets stats={stats} />

        {/* Quick Summary */}
        <div className="mt-12 bg-gradient-to-r from-green-600 to-green-700 rounded-xl shadow-lg overflow-hidden">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Today's Highlights</h2>
              <div className="bg-white/20 rounded-lg px-3 py-1">
                <span className="text-white text-sm font-medium">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/10 backdrop-blur rounded-xl p-6 text-center">
                <p className="text-3xl font-bold text-white mb-2">
                  ₹{(stats?.payments?.todayCollection || 0).toLocaleString('en-IN')}
                </p>
                <p className="text-green-100 text-sm font-medium">Today's Collection</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-6 text-center">
                <p className="text-3xl font-bold text-white mb-2">
                  {stats?.loans?.active || 0}
                </p>
                <p className="text-green-100 text-sm font-medium">Active Loans</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-6 text-center">
                <p className="text-3xl font-bold text-white mb-2">
                  {stats?.members?.active || 0}
                </p>
                <p className="text-green-100 text-sm font-medium">Active Members</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}