import React, { useState } from 'react'
import { FileText, Download, Calendar, Filter } from 'lucide-react'
import { api } from '../api/client'

export function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState('collection')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  })

  const reportTypes = [
    {
      id: 'collection',
      name: 'Collection Report',
      description: 'Summary of all payments collected during a period',
      icon: '📊'
    },
    {
      id: 'outstanding',
      name: 'Outstanding Loans',
      description: 'List of all loans with outstanding amounts',
      icon: '📋'
    },
    {
      id: 'disbursement',
      name: 'Disbursement Report',
      description: 'Summary of loan disbursements during a period',
      icon: '💰'
    },
    {
      id: 'overdue',
      name: 'Overdue Report',
      description: 'Members with overdue EMI payments',
      icon: '⚠️'
    },
    {
      id: 'savings',
      name: 'Savings Report',
      description: 'Member savings account summary',
      icon: '🏦'
    },
    {
      id: 'memberList',
      name: 'Member List',
      description: 'Complete list of all members',
      icon: '👥'
    },
    {
      id: 'loanList',
      name: 'Loan List',
      description: 'Complete list of all loans',
      icon: '📝'
    },
    {
      id: 'interestIncome',
      name: 'Interest Income',
      description: 'Interest income earned during a period',
      icon: '💹'
    }
  ]

  const handleGenerateReport = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = {
        fromDate: dateRange.from,
        toDate: dateRange.to
      }

      const reportData = await api.reports[selectedReport](params)
      
      // Create and download the report
      const blob = new Blob([reportData], { type: 'application/octet-stream' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${selectedReport}_report_${dateRange.from}_to_${dateRange.to}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const selectedReportInfo = reportTypes.find(r => r.id === selectedReport)

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-8 w-8 text-green-600" />
            Reports
          </h1>
          <p className="text-gray-600 mt-1">Generate and download various reports</p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="text-red-800 font-medium">Error generating report</h3>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Filter className="h-5 w-5 text-green-600" />
              Select Report Type
            </h2>
            
            <div className="space-y-3">
              {reportTypes.map((report) => (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report.id)}
                  className={`w-full p-3 text-left rounded-lg border transition-colors ${
                    selectedReport === report.id
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{report.icon}</span>
                    <div>
                      <div className="font-medium">{report.name}</div>
                      <div className="text-sm text-gray-500 mt-1">{report.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Report Configuration and Generation */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="text-2xl">{selectedReportInfo?.icon}</span>
                {selectedReportInfo?.name}
              </h2>
              <p className="text-gray-600 mt-1">{selectedReportInfo?.description}</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Date Range Selection */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-600" />
                  Date Range
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={dateRange.from}
                      onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={dateRange.to}
                      onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Quick Date Presets */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <button
                    onClick={() => setDateRange({
                      from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
                      to: new Date().toISOString().split('T')[0]
                    })}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    This Month
                  </button>
                  <button
                    onClick={() => setDateRange({
                      from: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0],
                      to: new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().split('T')[0]
                    })}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    Last Month
                  </button>
                  <button
                    onClick={() => setDateRange({
                      from: new Date(new Date().getFullYear(), 3, 1).toISOString().split('T')[0], // April
                      to: new Date(new Date().getFullYear() + 1, 2, 31).toISOString().split('T')[0] // March next year
                    })}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    Current FY
                  </button>
                  <button
                    onClick={() => setDateRange({
                      from: new Date(new Date().getFullYear() - 1, 3, 1).toISOString().split('T')[0],
                      to: new Date(new Date().getFullYear(), 2, 31).toISOString().split('T')[0]
                    })}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    Previous FY
                  </button>
                </div>
              </div>

              {/* Report Preview/Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Report Summary</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Report Type: <span className="font-medium text-gray-900">{selectedReportInfo?.name}</span></div>
                  <div>Date Range: <span className="font-medium text-gray-900">{dateRange.from} to {dateRange.to}</span></div>
                  <div>Format: <span className="font-medium text-gray-900">PDF</span></div>
                </div>
              </div>

              {/* Generate Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleGenerateReport}
                  disabled={loading}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      Generate & Download Report
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Recent Reports */}
          <div className="bg-white rounded-lg shadow mt-6 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reports</h3>
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Recent reports will appear here</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}