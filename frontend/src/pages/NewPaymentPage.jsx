import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, ArrowLeft, DollarSign, Search } from 'lucide-react'
import { api } from '../api/client'

export function NewPaymentPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [members, setMembers] = useState([])
  const [loans, setLoans] = useState([])
  const [selectedMember, setSelectedMember] = useState(null)
  const [selectedLoan, setSelectedLoan] = useState(null)
  const [memberSearch, setMemberSearch] = useState('')
  const [loanSearch, setLoanSearch] = useState('')
  
  const [formData, setFormData] = useState({
    type: 'loan_emi',
    memberId: '',
    loanId: '',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    method: 'cash',
    referenceNumber: '',
    remarks: '',
    emiNumbers: []
  })

  useEffect(() => {
    loadMembers()
  }, [])

  useEffect(() => {
    if (selectedMember) {
      loadMemberLoans(selectedMember.id)
    }
  }, [selectedMember])

  const loadMembers = async () => {
    try {
      const memberData = await api.members.list({ limit: 100 })
      setMembers(memberData)
    } catch (err) {
      console.error('Error loading members:', err)
    }
  }

  const loadMemberLoans = async (memberId) => {
    try {
      const loanData = await api.loans.list({ memberId, status: 'active' })
      setLoans(loanData)
    } catch (err) {
      console.error('Error loading loans:', err)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleMemberSelect = (member) => {
    setSelectedMember(member)
    setFormData(prev => ({
      ...prev,
      memberId: member.id,
      loanId: '' // Reset loan selection
    }))
    setSelectedLoan(null)
    setMemberSearch('')
    setLoanSearch('')
  }

  const handleLoanSelect = (loan) => {
    setSelectedLoan(loan)
    
    // Find next unpaid or partially paid EMI(s)
    let targetEMIs = []
    let totalAmount = 0
    let emiDetails = null
    
    if (loan.schedule) {
      // Get the first unpaid or partially paid EMI
      const firstUnpaid = loan.schedule.find(emi => 
        emi.paymentStatus !== 'paid' || emi.paymentStatus === 'partial'
      )
      
      if (firstUnpaid) {
        targetEMIs.push(firstUnpaid.emiNumber)
        
        // Calculate remaining amount for partial payments
        if (firstUnpaid.paymentStatus === 'partial' && firstUnpaid.amountDue) {
          totalAmount = firstUnpaid.amountDue
          emiDetails = {
            emiNumber: firstUnpaid.emiNumber,
            totalDue: firstUnpaid.totalPayment,
            amountPaid: firstUnpaid.amountPaid || 0,
            amountDue: firstUnpaid.amountDue,
            partialPayments: firstUnpaid.partialPayments
          }
        } else {
          totalAmount = firstUnpaid.totalPayment || 
                       (firstUnpaid.monthlyPrincipal + firstUnpaid.monthlyInterest + (firstUnpaid.monthlySavings || 0))
        }
      }
    }
    
    setFormData(prev => ({
      ...prev,
      loanId: loan.id,
      amount: totalAmount || loan.nextEmiAmount || '',
      emiNumbers: targetEMIs,
      emiDetails
    }))
    setLoanSearch('')
  }

  const handleTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      type,
      loanId: type === 'loan_emi' ? prev.loanId : '',
      amount: type === 'loan_emi' && selectedLoan ? selectedLoan.nextEmiAmount : ''
    }))
    if (type !== 'loan_emi') {
      setSelectedLoan(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!selectedMember) {
        throw new Error('Please select a member')
      }

      if (formData.type === 'loan_emi' && !selectedLoan) {
        throw new Error('Please select a loan for EMI payment')
      }

      // Create payment
      const payment = await api.payments.create({
        ...formData,
        amount: parseFloat(formData.amount)
      })

      navigate('/payments', { 
        state: { 
          message: `Payment ${payment.paymentId} for ${selectedMember.name} recorded successfully!` 
        } 
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    member.memberId.toLowerCase().includes(memberSearch.toLowerCase()) ||
    member.phone.includes(memberSearch)
  )

  const filteredLoans = loans.filter(loan =>
    loan.loanId.toLowerCase().includes(loanSearch.toLowerCase())
  )

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/payments')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <DollarSign className="h-8 w-8 text-green-600" />
              Record Payment
            </h1>
            <p className="text-gray-600 mt-1">Record a new payment from member</p>
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

      <div className="max-w-4xl">
        <div className="bg-white rounded-lg shadow">
          <form onSubmit={handleSubmit}>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Payment Details</h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Payment Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Type *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { value: 'loan_emi', label: 'Loan EMI', color: 'blue' },
                    { value: 'savings', label: 'Savings', color: 'green' },
                    { value: 'fee', label: 'Fee', color: 'yellow' },
                    { value: 'penalty', label: 'Penalty', color: 'red' }
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleTypeChange(type.value)}
                      className={`p-3 border rounded-lg text-center transition-colors ${
                        formData.type === type.value
                          ? `border-${type.color}-500 bg-${type.color}-50 text-${type.color}-700`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Member Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Member *
                </label>
                {selectedMember ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div>
                      <div className="font-medium text-green-800">{selectedMember.name}</div>
                      <div className="text-sm text-green-600">{selectedMember.memberId} • {selectedMember.phone}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMember(null)
                        setSelectedLoan(null)
                        setFormData(prev => ({ ...prev, memberId: '', loanId: '' }))
                      }}
                      className="text-green-600 hover:text-green-800 text-sm"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type="text"
                        placeholder="Search by name, member ID, or phone..."
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    {memberSearch && (
                      <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
                        {filteredMembers.length > 0 ? (
                          filteredMembers.map((member) => (
                            <button
                              key={member.id}
                              type="button"
                              onClick={() => handleMemberSelect(member)}
                              className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">{member.name}</div>
                              <div className="text-sm text-gray-500">{member.memberId} • {member.phone}</div>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-gray-500 text-center">No members found</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Loan Selection (only for EMI payments) */}
              {formData.type === 'loan_emi' && selectedMember && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Loan *
                  </label>
                  {selectedLoan ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div>
                          <div className="font-medium text-blue-800">{selectedLoan.loanId}</div>
                          <div className="text-sm text-blue-600">
                            Outstanding: ₹{selectedLoan.outstandingBalance?.toLocaleString()} • 
                            {selectedLoan.schedule && ` ${selectedLoan.schedule.filter(e => e.paymentStatus === 'paid').length}/${selectedLoan.schedule.length} EMIs paid`}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLoan(null)
                            setFormData(prev => ({ ...prev, loanId: '', amount: '', emiNumbers: [] }))
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Change
                        </button>
                      </div>
                      
                      {/* EMI Selection */}
                      {formData.emiNumbers.length > 0 && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="text-sm font-medium text-green-800 mb-1">
                            Paying EMI #{formData.emiNumbers.join(', #')}
                            {formData.emiDetails && formData.emiDetails.amountPaid > 0 && (
                              <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                Partial Payment
                              </span>
                            )}
                          </div>
                          {formData.emiDetails && formData.emiDetails.amountPaid > 0 && (
                            <div className="text-xs text-gray-600 mb-1">
                              <div>Already Paid: ₹{formData.emiDetails.amountPaid.toLocaleString()}</div>
                              <div>Remaining Due: ₹{formData.emiDetails.amountDue.toLocaleString()}</div>
                              {formData.emiDetails.partialPayments && (
                                <div className="mt-1 text-gray-500">
                                  (Interest: ₹{(formData.emiDetails.partialPayments.interestPaid || 0).toLocaleString()} | 
                                   Principal: ₹{(formData.emiDetails.partialPayments.principalPaid || 0).toLocaleString()})
                                </div>
                              )}
                            </div>
                          )}
                          <div className="text-xs text-green-600">
                            Payment Amount: ₹{parseFloat(formData.amount || 0).toLocaleString()}
                            {parseFloat(formData.amount) < (formData.emiDetails?.amountDue || parseFloat(formData.amount)) && (
                              <span className="ml-2 text-orange-600">(Partial Payment - Interest will be paid first)</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                          type="text"
                          placeholder="Search by loan ID..."
                          value={loanSearch}
                          onChange={(e) => setLoanSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      {loanSearch && (
                        <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
                          {filteredLoans.length > 0 ? (
                            filteredLoans.map((loan) => (
                              <button
                                key={loan.id}
                                type="button"
                                onClick={() => handleLoanSelect(loan)}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                              >
                                <div className="font-medium text-gray-900">{loan.loanId}</div>
                                <div className="text-sm text-gray-500">
                                  Next EMI: ₹{loan.nextEmiAmount?.toLocaleString()} • Due: {loan.nextDueDate}
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-gray-500 text-center">No active loans found</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Payment Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount * (₹)
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    min="1"
                    step="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    name="paymentDate"
                    value={formData.paymentDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method *
                  </label>
                  <select
                    name="method"
                    value={formData.method}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="upi">UPI</option>
                    <option value="cheque">Cheque</option>
                    <option value="demand_draft">Demand Draft</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reference Number
                  </label>
                  <input
                    type="text"
                    name="referenceNumber"
                    value={formData.referenceNumber}
                    onChange={handleInputChange}
                    placeholder="Transaction ID, Cheque No., etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Remarks
                </label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Additional notes about this payment..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/payments')}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !selectedMember || (formData.type === 'loan_emi' && !selectedLoan)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Recording...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Record Payment
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}