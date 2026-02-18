import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Briefcase, Edit, CreditCard, AlertTriangle, CheckCircle, Clock, Printer, FileText } from 'lucide-react'
import { api } from '../api/client'
import { useConfig } from '../context/ConfigContext'

export function ViewLoanPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { formatCurrency, formatDate } = useConfig()
  const [loan, setLoan] = useState(null)
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadLoan()
  }, [id])

  // Reload loan data when page regains focus (e.g., after making payment)
  useEffect(() => {
    const handleFocus = () => {
      loadLoan()
    }
    
    window.addEventListener('focus', handleFocus)
    
    // Also reload when navigating back to this page
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadLoan()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [id])

  const loadLoan = async () => {
    try {
      setLoading(true)
      const loanData = await api.loans.get(id)
      setLoan(loanData)
      
      // Load member details
      if (loanData.memberId) {
        try {
          const memberData = await api.members.get(loanData.memberId)
          setMember(memberData)
        } catch (err) {
          console.warn('Could not load member details:', err.message)
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    )
  }

  if (error || !loan) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error</h3>
          <p className="text-red-600 text-sm mt-1">{error || 'Loan not found'}</p>
        </div>
      </div>
    )
  }

  const getEMIStatus = (emi) => {
    if (emi.paymentStatus === 'paid') return 'paid'
    if (emi.paymentStatus === 'partial') return 'partial'
    
    const today = new Date().toISOString().split('T')[0]
    if (emi.dueDate < today && emi.paymentStatus !== 'partial') return 'overdue'
    if (emi.dueDate === today && emi.paymentStatus !== 'partial') return 'due'
    
    return 'upcoming'
  }

  const getEMIStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'partial': return 'bg-yellow-100 text-yellow-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      case 'due': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Calculate loan status details
  const getLoanStatusDetails = () => {
    if (!loan.schedule) return {}
    
    const paidEMIs = loan.schedule.filter(emi => emi.paymentStatus === 'paid')
    const partialEMIs = loan.schedule.filter(emi => emi.paymentStatus === 'partial')
    const totalEMIs = loan.schedule.length
    console.log('Payment Status Debug:', {
      totalEMIs,
      paidCount: paidEMIs.length,
      partialCount: partialEMIs.length,
      paidEMIs: paidEMIs.map(e => ({ emiNumber: e.emiNumber, status: e.paymentStatus })),
      partialEMIs: partialEMIs.map(e => ({ 
        emiNumber: e.emiNumber, 
        status: e.paymentStatus,
        amountPaid: e.amountPaid,
        amountDue: e.amountDue 
      })),
      firstFewEMIs: loan.schedule.slice(0, 3).map(e => ({ 
        emiNumber: e.emiNumber, 
        paymentStatus: e.paymentStatus,
        paymentDate: e.paymentDate,
        amountPaid: e.amountPaid,
        amountDue: e.amountDue
      }))
    })
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Find next unpaid or partially paid EMI
    const unpaidEMIs = loan.schedule.filter(emi => emi.paymentStatus !== 'paid')
    const nextEMI = unpaidEMIs.length > 0 ? unpaidEMIs[0] : null
    
    // Calculate overdue
    const overdueEMIs = loan.schedule.filter(emi => {
      const dueDate = new Date(emi.dueDate)
      return emi.paymentStatus !== 'paid' && dueDate < today
    })
    
    // Calculate days overdue for the most overdue EMI
    let daysOverdue = 0
    if (overdueEMIs.length > 0) {
      const mostOverdue = new Date(overdueEMIs[0].dueDate)
      daysOverdue = Math.floor((today - mostOverdue) / (1000 * 60 * 60 * 24))
    }
    
    // Determine overall loan status
    let loanStatus = 'Active'
    let statusColor = 'bg-green-100 text-green-800'
    
    if (paidEMIs.length === totalEMIs) {
      loanStatus = 'Completed'
      statusColor = 'bg-blue-100 text-blue-800'
    } else if (overdueEMIs.length > 3) {
      loanStatus = 'Defaulted'
      statusColor = 'bg-red-100 text-red-800'
    } else if (overdueEMIs.length > 0) {
      loanStatus = 'Overdue'
      statusColor = 'bg-orange-100 text-orange-800'
    }
    
    // Get last payment date
    const paidEMIsSorted = [...paidEMIs].sort((a, b) => 
      new Date(b.paymentDate || b.dueDate) - new Date(a.paymentDate || a.dueDate)
    )
    const lastPaymentDate = paidEMIsSorted.length > 0 
      ? (paidEMIsSorted[0].paymentDate || paidEMIsSorted[0].dueDate)
      : null
    
    // Calculate progress including partial payments
    let totalProgress = paidEMIs.length
    partialEMIs.forEach(emi => {
      if (emi.amountPaid && emi.totalPayment) {
        totalProgress += (emi.amountPaid / emi.totalPayment)
      }
    })
    
    return {
      loanStatus,
      statusColor,
      paidEMIs: paidEMIs.length,
      partialEMIs: partialEMIs.length,
      totalEMIs,
      progressPercentage: (totalProgress / totalEMIs) * 100,
      nextEMI,
      overdueEMIs: overdueEMIs.length,
      daysOverdue,
      lastPaymentDate,
      paidDates: paidEMIs.map(emi => ({
        emiNumber: emi.emiNumber,
        dueDate: emi.dueDate,
        paymentDate: emi.paymentDate || emi.dueDate
      }))
    }
  }
  
  const statusDetails = getLoanStatusDetails()

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/loans')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Briefcase className="h-8 w-8 text-green-600" />
              Loan Details
            </h1>
            <p className="text-gray-600 mt-1">{loan.loanId}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/loans/${id}/edit`)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Edit size={16} />
            Edit Loan
          </button>
          <button
            onClick={() => navigate('/payments/new', { state: { loanId: loan.id } })}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <CreditCard size={16} />
            Make Payment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Loan Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Loan Status Card */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Loan Status</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Current Status */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-2">Current Status</label>
                  <div className="flex items-center gap-4">
                    <span className={`inline-flex px-4 py-2 text-lg font-bold rounded-full ${statusDetails.statusColor}`}>
                      {statusDetails.loanStatus}
                    </span>
                    {statusDetails.overdueEMIs > 0 && (
                      <span className="text-red-600 text-sm font-medium">
                        {statusDetails.daysOverdue} days overdue
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Payment Progress */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-2">Payment Progress</label>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">
                        {statusDetails.paidEMIs} of {statusDetails.totalEMIs} EMIs Paid
                        {statusDetails.partialEMIs > 0 && (
                          <span className="ml-1 text-yellow-600">
                            (+{statusDetails.partialEMIs} partial)
                          </span>
                        )}
                      </span>
                      <span className="font-bold text-gray-700">{Math.round(statusDetails.progressPercentage || 0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${statusDetails.progressPercentage || 0}%` }}
                      />
                    </div>
                    {statusDetails.partialEMIs > 0 && (
                      <div className="text-xs text-yellow-600">
                        Note: Progress includes partial payment contributions
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Next Due Date */}
                {statusDetails.nextEMI && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Next Due Date</label>
                    <p className="text-lg font-medium text-gray-900">{formatDate(statusDetails.nextEMI.dueDate)}</p>
                    <p className="text-sm text-gray-600">EMI #{statusDetails.nextEMI.emiNumber} - {formatCurrency(statusDetails.nextEMI.totalPayment)}</p>
                  </div>
                )}
                
                {/* Last Payment Date */}
                {statusDetails.lastPaymentDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Last Payment Date</label>
                    <p className="text-lg font-medium text-gray-900">{formatDate(statusDetails.lastPaymentDate)}</p>
                    <p className="text-sm text-gray-600">{statusDetails.paidEMIs} EMI{statusDetails.paidEMIs > 1 ? 's' : ''} paid</p>
                  </div>
                )}
                
                {/* Outstanding Info */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Outstanding Balance</label>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(loan.outstandingBalance || 0)}</p>
                  <p className="text-sm text-gray-600">{statusDetails.totalEMIs - statusDetails.paidEMIs} EMIs remaining</p>
                </div>
                
                {/* Overdue EMIs */}
                {statusDetails.overdueEMIs > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-red-600 mb-1">Overdue EMIs</label>
                    <p className="text-lg font-bold text-red-600">{statusDetails.overdueEMIs} EMI{statusDetails.overdueEMIs > 1 ? 's' : ''}</p>
                    <p className="text-sm text-red-600">Please make payment immediately</p>
                  </div>
                )}
                
                {/* Previous Payment Dates */}
                {statusDetails.paidDates && statusDetails.paidDates.length > 0 && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-500 mb-2">Payment History</label>
                    <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                      <div className="space-y-2">
                        {statusDetails.paidDates.map((payment) => (
                          <div key={payment.emiNumber} className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="font-medium">EMI #{payment.emiNumber}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-gray-600">Paid on </span>
                              <span className="font-medium text-gray-900">{formatDate(payment.paymentDate)}</span>
                              {payment.paymentDate !== payment.dueDate && (
                                <span className="text-xs text-gray-500 block">Due: {formatDate(payment.dueDate)}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Loan Information</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Loan ID</label>
                <p className="text-lg font-medium text-gray-900">{loan.loanId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                <span className={`inline-flex px-2 py-1 text-sm font-semibold rounded-full ${
                  loan.status === 'active' 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {loan.status}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Loan Amount</label>
                <p className="text-lg font-medium text-gray-900">{formatCurrency(loan.loanAmount)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Outstanding Balance</label>
                <p className="text-lg font-medium text-gray-900">{formatCurrency(loan.outstandingBalance || 0)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Tenure</label>
                <p className="text-lg font-medium text-gray-900">{loan.tenureMonths} months</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Interest Rate</label>
                <p className="text-lg font-medium text-gray-900">{loan.interest?.rate || '1.5'}% monthly</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Disbursement Date</label>
                <p className="text-lg font-medium text-gray-900">{formatDate(loan.disbursementDate)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Next EMI</label>
                <p className="text-lg font-medium text-gray-900">
                  EMI #{loan.nextEmiNumber || 1}
                </p>
              </div>
            </div>
          </div>

          {/* EMI Schedule */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">EMI Schedule</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => window.open(`/api/loans/${loan.id}/statement`, '_blank')}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <FileText size={16} />
                  Statement
                </button>
                <button
                  onClick={() => window.open(`/api/loans/${loan.id}/schedule-pdf`, '_blank')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Printer size={16} />
                  Print Schedule
                </button>
              </div>
            </div>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto shadow-inner rounded-lg">
              <table className="min-w-full bg-white">
                {/* Enhanced Table Header */}
                <thead>
                  <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider border-r border-blue-500">
                      <div className="flex items-center space-x-2">
                        <span>#</span>
                      </div>
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider border-r border-blue-500">
                      Due Date
                    </th>
                    <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wider border-r border-blue-500">
                      Opening Balance
                    </th>
                    <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wider border-r border-blue-500">
                      Principal
                    </th>
                    <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wider border-r border-blue-500">
                      Interest
                    </th>
                    <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wider border-r border-blue-500">
                      Closing Balance
                    </th>
                    <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wider border-r border-blue-500">
                      Savings
                    </th>
                    <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wider border-r border-blue-500">
                      EMI Amount
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loan.schedule?.map((emi, index) => {
                    const status = getEMIStatus(emi)
                    const isEven = index % 2 === 0
                    const isPaid = status === 'paid'
                    const isOverdue = status === 'overdue'
                    const isDue = status === 'due'
                    
                    return (
                      <tr 
                        key={emi.emiNumber} 
                        className={`
                          ${isEven ? 'bg-gray-50' : 'bg-white'}
                          ${isPaid ? 'bg-green-50 border-l-4 border-green-500' : ''}
                          ${isOverdue ? 'bg-red-50 border-l-4 border-red-500' : ''}
                          ${isDue ? 'bg-yellow-50 border-l-4 border-yellow-500' : ''}
                          hover:bg-blue-50 transition-colors duration-150 ease-in-out
                        `}
                      >
                        <td className="px-4 py-4 whitespace-nowrap border-r border-gray-200">
                          <div className={`
                            inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
                            ${isPaid ? 'bg-green-100 text-green-800' : 
                              isOverdue ? 'bg-red-100 text-red-800' : 
                              isDue ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-gray-100 text-gray-800'}
                          `}>
                            {emi.emiNumber}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm border-r border-gray-200">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">
                              {formatDate(emi.dueDate)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(emi.dueDate).toLocaleDateString('en-US', { weekday: 'short' })}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right border-r border-gray-200">
                          <div className="font-mono font-semibold text-gray-900">
                            {formatCurrency(emi.openingBalance)}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right border-r border-gray-200">
                          <div className="font-mono font-semibold text-blue-700">
                            {formatCurrency(emi.monthlyPrincipal)}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right border-r border-gray-200">
                          <div className="font-mono font-semibold text-orange-600">
                            {formatCurrency(emi.monthlyInterest)}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right border-r border-gray-200">
                          <div className="font-mono font-semibold text-gray-900">
                            {formatCurrency(emi.closingBalance)}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right border-r border-gray-200">
                          <div className="font-mono font-semibold text-purple-600">
                            {formatCurrency(emi.monthlySavings || 0)}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right border-r border-gray-200">
                          <div className="font-mono font-bold text-green-700 bg-green-50 px-2 py-1 rounded">
                            {formatCurrency(emi.totalPayment)}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <span className={`
                            inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
                            ${isPaid ? 'bg-green-100 text-green-800 ring-1 ring-green-600/20' : 
                              isOverdue ? 'bg-red-100 text-red-800 ring-1 ring-red-600/20' : 
                              isDue ? 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-600/20' : 
                              'bg-gray-100 text-gray-800 ring-1 ring-gray-600/20'}
                          `}>
                            {status === 'paid' && <CheckCircle size={12} className="mr-1" />}
                            {status === 'partial' && <Clock size={12} className="mr-1" />}
                            {status === 'overdue' && <AlertTriangle size={12} className="mr-1" />}
                            {status === 'due' && <Clock size={12} className="mr-1" />}
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                            {status === 'partial' && emi.amountPaid && (
                              <span className="ml-1 text-xs">
                                (₹{emi.amountPaid.toLocaleString('en-IN')})
                              </span>
                            )}
                          </span>
                        </td>
                      </tr>
                    )
                  }) || []}
                  
                  {/* Summary Row */}
                  {loan.schedule && loan.schedule.length > 0 && (
                    <tr className="bg-gradient-to-r from-gray-100 to-gray-200 border-t-2 border-gray-300">
                      <td colSpan="3" className="px-4 py-4 text-sm font-bold text-gray-700">
                        TOTALS
                      </td>
                      <td className="px-4 py-4 text-sm font-bold text-right text-blue-700 border-r border-gray-300">
                        {formatCurrency(loan.schedule.reduce((sum, emi) => sum + emi.monthlyPrincipal, 0))}
                      </td>
                      <td className="px-4 py-4 text-sm font-bold text-right text-orange-600 border-r border-gray-300">
                        {formatCurrency(loan.schedule.reduce((sum, emi) => sum + emi.monthlyInterest, 0))}
                      </td>
                      <td className="px-4 py-4 text-sm font-bold text-right border-r border-gray-300">
                        -
                      </td>
                      <td className="px-4 py-4 text-sm font-bold text-right text-purple-600 border-r border-gray-300">
                        {formatCurrency(loan.schedule.reduce((sum, emi) => sum + (emi.monthlySavings || 0), 0))}
                      </td>
                      <td className="px-4 py-4 text-sm font-bold text-right text-green-700 border-r border-gray-300">
                        {formatCurrency(loan.schedule.reduce((sum, emi) => sum + emi.totalPayment, 0))}
                      </td>
                      <td className="px-4 py-4"></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4 p-4">
              {loan.schedule?.map((emi, index) => {
                const status = getEMIStatus(emi)
                const isPaid = status === 'paid'
                const isOverdue = status === 'overdue'
                const isDue = status === 'due'
                
                return (
                  <div 
                    key={emi.emiNumber}
                    className={`
                      bg-white rounded-lg shadow-md p-4 border-l-4
                      ${isPaid ? 'border-green-500 bg-green-50' : 
                        isOverdue ? 'border-red-500 bg-red-50' : 
                        isDue ? 'border-yellow-500 bg-yellow-50' : 
                        'border-gray-300'}
                    `}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className={`
                        inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold
                        ${isPaid ? 'bg-green-100 text-green-800' : 
                          isOverdue ? 'bg-red-100 text-red-800' : 
                          isDue ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-gray-100 text-gray-800'}
                      `}>
                        {emi.emiNumber}
                      </div>
                      <span className={`
                        inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
                        ${isPaid ? 'bg-green-100 text-green-800' : 
                          isOverdue ? 'bg-red-100 text-red-800' : 
                          isDue ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-gray-100 text-gray-800'}
                      `}>
                        {status === 'paid' && <CheckCircle size={12} className="mr-1" />}
                        {status === 'partial' && <Clock size={12} className="mr-1" />}
                        {status === 'overdue' && <AlertTriangle size={12} className="mr-1" />}
                        {status === 'due' && <Clock size={12} className="mr-1" />}
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                      {status === 'partial' && emi.amountPaid && (
                        <div className="text-xs mt-1">
                          <span className="text-gray-600">Paid: ₹{emi.amountPaid.toLocaleString('en-IN')}</span>
                          {emi.amountDue && (
                            <span className="ml-2 text-orange-600">Due: ₹{emi.amountDue.toLocaleString('en-IN')}</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500 text-xs">Due Date</span>
                        <p className="font-medium text-gray-900">{formatDate(emi.dueDate)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs">EMI Amount</span>
                        <p className="font-bold text-green-700">{formatCurrency(emi.totalPayment)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs">Principal</span>
                        <p className="font-mono text-blue-700">{formatCurrency(emi.monthlyPrincipal)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs">Interest</span>
                        <p className="font-mono text-orange-600">{formatCurrency(emi.monthlyInterest)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs">Savings</span>
                        <p className="font-mono text-purple-600">{formatCurrency(emi.monthlySavings || 0)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs">Opening Balance</span>
                        <p className="font-mono text-gray-700">{formatCurrency(emi.openingBalance)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs">Closing Balance</span>
                        <p className="font-mono text-gray-700">{formatCurrency(emi.closingBalance)}</p>
                      </div>
                    </div>
                  </div>
                )
              }) || []}
              
              {/* Mobile Summary Card */}
              {loan.schedule && loan.schedule.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                  <h3 className="font-bold text-blue-900 mb-3">Summary Totals</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-blue-600 text-xs">Total Principal</span>
                      <p className="font-bold text-blue-700">
                        {formatCurrency(loan.schedule.reduce((sum, emi) => sum + emi.monthlyPrincipal, 0))}
                      </p>
                    </div>
                    <div>
                      <span className="text-orange-600 text-xs">Total Interest</span>
                      <p className="font-bold text-orange-600">
                        {formatCurrency(loan.schedule.reduce((sum, emi) => sum + emi.monthlyInterest, 0))}
                      </p>
                    </div>
                    <div>
                      <span className="text-purple-600 text-xs">Total Savings</span>
                      <p className="font-bold text-purple-600">
                        {formatCurrency(loan.schedule.reduce((sum, emi) => sum + (emi.monthlySavings || 0), 0))}
                      </p>
                    </div>
                    <div>
                      <span className="text-green-600 text-xs">Total Repayment</span>
                      <p className="font-bold text-green-700">
                        {formatCurrency(loan.schedule.reduce((sum, emi) => sum + emi.totalPayment, 0))}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Member Information */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Member Information</h2>
            </div>
            <div className="p-6">
              {member ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Name</label>
                    <p className="text-lg font-medium text-gray-900">{member.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Member ID</label>
                    <p className="text-lg font-medium text-gray-900">{member.memberId}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
                    <p className="text-lg font-medium text-gray-900">{member.phone}</p>
                  </div>
                  {member.email && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                      <p className="text-lg font-medium text-gray-900">{member.email}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Address</label>
                    <p className="text-lg font-medium text-gray-900">{member.address}</p>
                  </div>
                  <Link
                    to={`/members/${member.id}`}
                    className="text-green-600 hover:text-green-800 text-sm font-medium"
                  >
                    View Full Profile →
                  </Link>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Member ID</label>
                  <p className="text-lg font-medium text-gray-900">{loan.memberId}</p>
                  <p className="text-sm text-gray-500 mt-2">Member details not available</p>
                </div>
              )}
            </div>
          </div>

          {/* Loan Summary */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Loan Summary</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Total Interest</label>
                <p className="text-lg font-medium text-gray-900">{formatCurrency(loan.summary?.totalInterest || 0)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Total Repayment</label>
                <p className="text-lg font-medium text-gray-900">{formatCurrency(loan.summary?.totalRepayment || loan.loanAmount || 0)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Monthly EMI</label>
                <p className="text-lg font-medium text-gray-900">{formatCurrency(loan.summary?.monthlyEMI || 0)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}