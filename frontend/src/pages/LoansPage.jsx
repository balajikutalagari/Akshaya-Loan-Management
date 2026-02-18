import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Briefcase, AlertTriangle } from 'lucide-react'
import { useConfig } from '../context/ConfigContext'
import { api } from '../api/client'

export function LoansPage() {
  const navigate = useNavigate()
  const { formatCurrency, formatDate } = useConfig()
  const [loans, setLoans] = useState([])
  const [filter, setFilter] = useState('all') // all, active, overdue
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadLoans()
  }, [filter])

  const loadLoans = async () => {
    try {
      setLoading(true)
      let data
      
      if (filter === 'active') {
        data = await api.loans.list({ status: 'active' })
      } else if (filter === 'overdue') {
        data = await api.loans.overdue()
      } else {
        data = await api.loans.list({ limit: 100 })
      }
      
      setLoans(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-medium">Error loading loans</h3>
        <p className="text-red-600 text-sm mt-1">{error}</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Briefcase className="h-8 w-8 text-green-600" />
            Loans
          </h1>
          <p className="text-gray-600 mt-1">{loans.length} loans found</p>
        </div>
        <Link
          to="/loans/new"
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <Plus size={20} />
          New Loan
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === 'all'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Loans
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === 'active'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Active Loans
          </button>
          <button
            onClick={() => setFilter('overdue')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === 'overdue'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Overdue Loans
          </button>
        </div>
      </div>

      {/* Loans List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : loans.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No loans found</h3>
          <p className="text-gray-600 mb-4">
            {filter === 'overdue' 
              ? 'No overdue loans at the moment' 
              : 'Get started by creating your first loan'}
          </p>
          {filter !== 'overdue' && (
            <Link
              to="/loans/new"
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Create First Loan
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loan Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Next EMI
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{loan.loanId}</div>
                        <div className="text-sm text-gray-500">
                          {loan.tenureMonths} months • {loan.interest?.rate || '1.5'}% monthly
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{loan.memberName}</div>
                        <div className="text-sm text-gray-500">{loan.memberId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(loan.loanAmount)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Outstanding: {formatCurrency(loan.outstandingBalance || 0)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          loan.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {loan.status}
                        </span>
                        {filter === 'overdue' && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {loan.nextEmiDate ? formatDate(loan.nextEmiDate) : 'N/A'}
                      {loan.nextEmiAmount && (
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(loan.nextEmiAmount)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => navigate(`/loans/${loan.id}`)}
                        className="text-green-600 hover:text-green-900 mr-3"
                      >
                        View
                      </button>
                      <button 
                        onClick={() => navigate('/payments/new', { state: { loanId: loan.id } })}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Payment
                      </button>
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