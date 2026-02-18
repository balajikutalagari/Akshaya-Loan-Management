import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, DollarSign, Receipt, Filter } from 'lucide-react'
import { api } from '../api/client'

export function PaymentsPage() {
  const [payments, setPayments] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadPayments()
  }, [filter])

  const loadPayments = async () => {
    try {
      setLoading(true)
      const params = { limit: 100 }
      if (filter !== 'all') {
        params.type = filter
      }
      const data = await api.payments.list(params)
      setPayments(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (query) => {
    setSearchQuery(query)
    // Implement search functionality if needed
  }

  const getPaymentTypeColor = (type) => {
    switch (type) {
      case 'loan_emi':
        return 'bg-blue-100 text-blue-800'
      case 'savings':
        return 'bg-green-100 text-green-800'
      case 'fee':
        return 'bg-yellow-100 text-yellow-800'
      case 'penalty':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredPayments = payments.filter(payment => {
    if (!searchQuery) return true
    const search = searchQuery.toLowerCase()
    return (
      payment.memberName?.toLowerCase().includes(search) ||
      payment.paymentId?.toLowerCase().includes(search) ||
      payment.loanId?.toLowerCase().includes(search) ||
      payment.memberId?.toLowerCase().includes(search)
    )
  })

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error loading payments</h3>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="h-8 w-8 text-green-600" />
            Payments
          </h1>
          <p className="text-gray-600 mt-1">{filteredPayments.length} payments found</p>
        </div>
        <Link
          to="/payments/new"
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Record Payment
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Payments</option>
            <option value="loan_emi">Loan EMI</option>
            <option value="savings">Savings</option>
            <option value="fee">Fees</option>
            <option value="penalty">Penalties</option>
          </select>
        </div>
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by member name, payment ID, loan ID..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Payments List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery ? 'Try adjusting your search terms' : 'Start by recording your first payment'}
          </p>
          <Link
            to="/payments/new"
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 inline-flex items-center gap-2"
          >
            <Plus size={20} />
            Record Payment
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{payment.paymentId}</div>
                      {payment.loanId && (
                        <div className="text-sm text-gray-500">Loan: {payment.loanId}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{payment.memberName}</div>
                        <div className="text-sm text-gray-500">{payment.memberId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentTypeColor(payment.type)}`}>
                        {payment.type?.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">₹{payment.amount?.toLocaleString()}</div>
                      {payment.method && (
                        <div className="text-sm text-gray-500">{payment.method}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.paymentDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={async () => {
                            try {
                              const response = await fetch(`/api/receipts/generate/${payment.id}`, { method: 'POST' })
                              const receipt = await response.json()
                              window.open(`/api/receipts/${receipt.id}/pdf`, '_blank')
                            } catch (err) {
                              console.error('Error generating receipt:', err)
                            }
                          }}
                          className="text-green-600 hover:text-green-900 flex items-center gap-1"
                        >
                          <Receipt size={16} />
                          Receipt
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}