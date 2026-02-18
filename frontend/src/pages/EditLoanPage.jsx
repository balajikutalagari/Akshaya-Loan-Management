import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save, ArrowLeft, Briefcase } from 'lucide-react'
import { api } from '../api/client'

export function EditLoanPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [loadingLoan, setLoadingLoan] = useState(true)
  const [error, setError] = useState(null)
  
  const [formData, setFormData] = useState({
    status: '',
    notes: ''
  })

  useEffect(() => {
    loadLoan()
  }, [id])

  const loadLoan = async () => {
    try {
      setLoadingLoan(true)
      const loan = await api.loans.get(id)
      setFormData({
        status: loan.status || '',
        notes: loan.notes || ''
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingLoan(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await api.loans.update(id, formData)
      navigate(`/loans/${id}`, { 
        state: { 
          message: 'Loan updated successfully!' 
        } 
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loadingLoan) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/loans/${id}`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Briefcase className="h-8 w-8 text-green-600" />
              Edit Loan
            </h1>
            <p className="text-gray-600 mt-1">Update loan information</p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="text-red-800 font-medium">Error</h3>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-lg shadow">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Loan Information</h2>
            <p className="text-sm text-gray-600 mt-1">
              Only certain fields can be modified after loan creation
            </p>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loan Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                  <option value="defaulted">Defaulted</option>
                  <option value="suspended">Suspended</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Change the loan status based on current situation
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={4}
                placeholder="Add any notes or comments about this loan..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Internal notes for reference (not visible to member)
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-yellow-800 font-medium text-sm">Important Note</h3>
              <p className="text-yellow-700 text-sm mt-1">
                Core loan details like amount, tenure, and interest rate cannot be modified after creation. 
                For payment adjustments, use the payment system. Contact administration for major changes.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate(`/loans/${id}`)}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Update Loan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}