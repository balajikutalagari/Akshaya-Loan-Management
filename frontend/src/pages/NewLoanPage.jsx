import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, ArrowLeft, CreditCard, Search, Calculator, ChevronDown, ChevronUp } from 'lucide-react'
import { api } from '../api/client'
import { useConfig } from '../context/ConfigContext'

export function NewLoanPage() {
  const navigate = useNavigate()
  const { config } = useConfig()
  const [loading, setLoading] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [error, setError] = useState(null)
  const [members, setMembers] = useState([])
  const [selectedMember, setSelectedMember] = useState(null)
  const [memberSearch, setMemberSearch] = useState('')
  const [emiCalculation, setEmiCalculation] = useState(null)
  const [showAllEMIs, setShowAllEMIs] = useState(false)
  
  const [formData, setFormData] = useState({
    memberId: '',
    amount: '',
    tenureMonths: config?.loan?.tenure?.defaultMonths || 20,
    interestRate: config?.loan?.interest?.defaultRate || 2,
    savingsAmount: config?.savings?.defaultAmount || 200,
    lateFeeAmount: 1000,
    purpose: '',
    guarantor1: {
      name: '',
      phone: '',
      relation: ''
    },
    guarantor2: {
      name: '',
      phone: '',
      relation: ''
    }
  })

  useEffect(() => {
    loadMembers()
  }, [])

  useEffect(() => {
    if (formData.amount && formData.tenureMonths && formData.interestRate) {
      setShowAllEMIs(false) // Reset expanded state when recalculating
      calculateEMI()
    }
  }, [formData.amount, formData.tenureMonths, formData.interestRate, formData.savingsAmount])

  const loadMembers = async () => {
    try {
      const memberData = await api.members.list({ limit: 100 })
      setMembers(memberData)
    } catch (err) {
      console.error('Error loading members:', err)
    }
  }

  const calculateEMI = async () => {
    if (!formData.amount || !formData.tenureMonths || !formData.interestRate) {
      setEmiCalculation(null)
      return
    }
    
    setCalculating(true)
    try {
      const calculation = await api.loans.calculate({
        loanAmount: parseFloat(formData.amount),
        tenureMonths: parseInt(formData.tenureMonths),
        interestRate: parseFloat(formData.interestRate),
        savingsAmount: parseFloat(formData.savingsAmount) || 200
      })
      console.log('EMI Calculation Response:', calculation) // Debug log
      if (calculation && calculation.schedule) {
        setEmiCalculation(calculation)
      } else {
        console.error('Invalid calculation response:', calculation)
        setEmiCalculation(null)
      }
    } catch (err) {
      console.error('Error calculating EMI:', err)
      setEmiCalculation(null)
    } finally {
      setCalculating(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    if (name.startsWith('guarantor1.') || name.startsWith('guarantor2.')) {
      const [guarantor, field] = name.split('.')
      setFormData(prev => ({
        ...prev,
        [guarantor]: {
          ...prev[guarantor],
          [field]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleMemberSelect = (member) => {
    setSelectedMember(member)
    setFormData(prev => ({
      ...prev,
      memberId: member.id
    }))
    setMemberSearch('')
  }

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    member.memberId.toLowerCase().includes(memberSearch.toLowerCase()) ||
    member.phone.includes(memberSearch)
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!selectedMember) {
        throw new Error('Please select a member')
      }

      // Check eligibility
      const eligibility = await api.loans.eligibility(selectedMember.id, formData.amount)
      if (!eligibility.eligible) {
        throw new Error(`Member not eligible: ${eligibility.issues.join(', ')}`)
      }

      // Create loan
      const loan = await api.loans.create({
        ...formData,
        amount: parseFloat(formData.amount),
        tenureMonths: parseInt(formData.tenureMonths),
        interestRate: parseFloat(formData.interestRate),
        savingsAmount: parseFloat(formData.savingsAmount)
      })

      navigate('/loans', { 
        state: { 
          message: `Loan application ${loan.loanId} for ${selectedMember.name} created successfully!` 
        } 
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const tenurePresets = config?.loan?.tenure?.presets || [
    { months: 12, label: '12 Months' },
    { months: 18, label: '18 Months' },
    { months: 20, label: '20 Months', popular: true },
    { months: 24, label: '24 Months', popular: true },
    { months: 36, label: '36 Months' }
  ]

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/loans')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <CreditCard className="h-8 w-8 text-green-600" />
              New Loan Application
            </h1>
            <p className="text-gray-600 mt-1">Create a new loan for a member</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <form onSubmit={handleSubmit}>
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Loan Details</h2>
              </div>

              <div className="p-6 space-y-6">
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
                        onClick={() => setSelectedMember(null)}
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

                {/* Loan Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loan Amount * (₹)
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    min={config?.loan?.minAmount || 50000}
                    max={config?.loan?.maxAmount || 10000000}
                    step={config?.loan?.amountStep || 10000}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                  <div className="text-sm text-gray-500 mt-1">
                    Range: ₹{config?.loan?.minAmount?.toLocaleString() || '50,000'} - ₹{config?.loan?.maxAmount?.toLocaleString() || '1,00,00,000'}
                  </div>
                </div>

                {/* Tenure Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tenure *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                    {tenurePresets.map((preset) => (
                      <button
                        key={preset.months}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, tenureMonths: preset.months }))}
                        className={`p-3 border rounded-lg text-center transition-colors ${
                          formData.tenureMonths === preset.months
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 hover:border-gray-300'
                        } ${preset.popular ? 'ring-2 ring-green-100' : ''}`}
                      >
                        <div className="font-medium">{preset.label}</div>
                        {preset.popular && (
                          <div className="text-xs text-green-600 mt-1">Popular</div>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      name="tenureMonths"
                      value={formData.tenureMonths}
                      onChange={handleInputChange}
                      min={config?.loan?.tenure?.minMonths || 6}
                      max={config?.loan?.tenure?.maxMonths || 60}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                    <span className="text-gray-600">months</span>
                  </div>
                </div>

                {/* Interest Rate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interest Rate * (% per month)
                  </label>
                  <input
                    type="number"
                    name="interestRate"
                    value={formData.interestRate}
                    onChange={handleInputChange}
                    step="0.1"
                    min="0.5"
                    max="5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Monthly Savings */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Savings Amount *
                  </label>
                  <input
                    type="number"
                    name="savingsAmount"
                    value={formData.savingsAmount}
                    onChange={handleInputChange}
                    min={config?.savings?.minAmount || 100}
                    max={config?.savings?.maxAmount || 10000}
                    step="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                  <div className="text-sm text-gray-500 mt-1">
                    Monthly savings to be collected with EMI (Default: ₹{config?.savings?.defaultAmount || 200})
                  </div>
                </div>

                {/* Late Fee Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Late Payment Fee *
                  </label>
                  <input
                    type="number"
                    name="lateFeeAmount"
                    value={formData.lateFeeAmount || 1000}
                    onChange={handleInputChange}
                    min={0}
                    max={10000}
                    step="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                  <div className="text-sm text-gray-500 mt-1">
                    Fee charged if payment is made after the due month (Default: ₹1000)
                  </div>
                </div>

                {/* Purpose */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loan Purpose
                  </label>
                  <textarea
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Purpose for taking the loan..."
                  />
                </div>

                {/* Guarantors */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-md font-medium text-gray-900 mb-4">Guarantor Information</h3>
                  
                  {/* Guarantor 1 */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Guarantor 1</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input
                        type="text"
                        name="guarantor1.name"
                        placeholder="Name"
                        value={formData.guarantor1.name}
                        onChange={handleInputChange}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <input
                        type="tel"
                        name="guarantor1.phone"
                        placeholder="Phone"
                        value={formData.guarantor1.phone}
                        onChange={handleInputChange}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        name="guarantor1.relation"
                        placeholder="Relation"
                        value={formData.guarantor1.relation}
                        onChange={handleInputChange}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Guarantor 2 */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Guarantor 2</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input
                        type="text"
                        name="guarantor2.name"
                        placeholder="Name"
                        value={formData.guarantor2.name}
                        onChange={handleInputChange}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <input
                        type="tel"
                        name="guarantor2.phone"
                        placeholder="Phone"
                        value={formData.guarantor2.phone}
                        onChange={handleInputChange}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        name="guarantor2.relation"
                        placeholder="Relation"
                        value={formData.guarantor2.relation}
                        onChange={handleInputChange}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => navigate('/loans')}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedMember}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Create Loan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* EMI Schedule Preview Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow sticky top-6">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calculator className="h-5 w-5 text-green-600" />
                EMI Schedule Preview
              </h3>
            </div>
            
            <div className="max-h-[600px] overflow-y-auto">
              {calculating ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : emiCalculation && emiCalculation.schedule ? (
                <div>
                  {/* Summary Card */}
                  <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 border-b">
                    <div className="text-center">
                      <div className="text-xs text-green-600 uppercase tracking-wide">Monthly EMI</div>
                      <div className="text-2xl font-bold text-green-800">
                        ₹{emiCalculation.summary?.monthlyEMI?.toLocaleString('en-IN') || 0}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                      <div>
                        <span className="text-gray-600">Principal:</span>
                        <span className="font-medium ml-1">₹{parseFloat(formData.amount || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Interest:</span>
                        <span className="font-medium ml-1">₹{emiCalculation.summary?.totalInterest?.toLocaleString('en-IN') || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Tenure:</span>
                        <span className="font-medium ml-1">{formData.tenureMonths} months</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Rate:</span>
                        <span className="font-medium ml-1">{formData.interestRate}% p.m.</span>
                      </div>
                    </div>
                  </div>

                  {/* Mini Schedule Table */}
                  <div className="p-4">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-gray-600 border-b">
                          <th className="pb-2 text-left">EMI</th>
                          <th className="pb-2 text-right">Principal</th>
                          <th className="pb-2 text-right">Interest</th>
                          <th className="pb-2 text-right">Total</th>
                          <th className="pb-2 text-right">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {emiCalculation.schedule && Array.isArray(emiCalculation.schedule) && 
                         emiCalculation.schedule.slice(0, showAllEMIs ? undefined : 12).map((emi, index) => (
                          <tr key={emi.emiNumber || index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                            <td className="py-1 px-1 font-medium">#{emi.emiNumber || index + 1}</td>
                            <td className="py-1 px-1 text-right text-blue-600 text-xs">
                              ₹{(emi.monthlyPrincipal || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="py-1 px-1 text-right text-orange-600 text-xs">
                              ₹{(emi.monthlyInterest || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="py-1 px-1 text-right text-green-700 font-semibold text-xs">
                              ₹{(emi.totalPayment || ((emi.monthlyPrincipal || 0) + (emi.monthlyInterest || 0) + (emi.monthlySavings || 0))).toLocaleString('en-IN')}
                            </td>
                            <td className="py-1 px-1 text-right font-medium text-xs">
                              ₹{(emi.closingBalance || 0).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                        {emiCalculation.schedule && emiCalculation.schedule.length > 12 && (
                          <tr className="border-t">
                            <td colSpan="5" className="py-2 text-center">
                              <button
                                onClick={() => setShowAllEMIs(!showAllEMIs)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 mx-auto transition-colors"
                              >
                                {showAllEMIs ? (
                                  <>
                                    <ChevronUp size={16} />
                                    Show less
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown size={16} />
                                    Show {emiCalculation.schedule.length - 12} more EMIs
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 font-bold">
                          <td className="pt-2">Total</td>
                          <td className="pt-2 text-right text-blue-700 text-xs">
                            ₹{emiCalculation.summary?.totalPrincipal?.toLocaleString('en-IN') || parseFloat(formData.amount || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="pt-2 text-right text-orange-700 text-xs">
                            ₹{emiCalculation.summary?.totalInterest?.toLocaleString('en-IN') || 0}
                          </td>
                          <td className="pt-2 text-right text-green-700 text-xs">
                            ₹{emiCalculation.summary?.totalRepayment?.toLocaleString('en-IN') || 0}
                          </td>
                          <td className="pt-2 text-right text-xs">0</td>
                        </tr>
                      </tfoot>
                    </table>

                    {/* Processing Fee Info */}
                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="text-xs font-medium text-yellow-800 mb-1">Initial Collection</div>
                      <div className="space-y-1 text-xs text-yellow-700">
                        <div className="flex justify-between">
                          <span>Processing Fee:</span>
                          <span className="font-medium">₹{(emiCalculation.initialCollection?.processingFee || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Monthly Savings:</span>
                          <span className="font-medium">₹{parseFloat(formData.savingsAmount || 200).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between border-t border-yellow-300 pt-1">
                          <span>Total Payable:</span>
                          <span className="font-bold">₹{emiCalculation.summary?.totalRepayment?.toLocaleString('en-IN') || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : formData.amount && formData.tenureMonths && formData.interestRate ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto"></div>
                  <p className="mt-2 text-sm">Generating schedule...</p>
                </div>
              ) : (
                <div className="text-center text-gray-400 py-12">
                  <Calculator className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm">Enter loan details to preview</p>
                  <p className="text-xs mt-1">EMI schedule</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}