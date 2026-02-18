import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Phone, Mail, MapPin, Calendar, Edit, CreditCard, PiggyBank } from 'lucide-react'
import { api } from '../api/client'

export function ViewMemberPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [member, setMember] = useState(null)
  const [loans, setLoans] = useState([])
  const [savings, setSavings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadMember()
  }, [id])

  const loadMember = async () => {
    try {
      setLoading(true)
      const [memberData, loanData, savingsData] = await Promise.all([
        api.members.get(id),
        api.loans.list({ memberId: id }),
        api.savings.byMember(id)
      ])
      setMember(memberData)
      setLoans(loanData)
      setSavings(savingsData)
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

  if (error || !member) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error loading member</h3>
          <p className="text-red-600 text-sm mt-1">{error || 'Member not found'}</p>
          <button
            onClick={() => navigate('/members')}
            className="mt-3 text-red-600 hover:text-red-800"
          >
            ← Back to Members
          </button>
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
            onClick={() => navigate('/members')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <User className="h-8 w-8 text-green-600" />
              {member.name}
            </h1>
            <p className="text-gray-600 mt-1">Member ID: {member.memberId}</p>
          </div>
        </div>
        <button
          onClick={() => navigate(`/members/${id}/edit`)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Edit size={16} />
          Edit Member
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Member Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Full Name</div>
                  <div className="font-medium">{member.name}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Phone</div>
                  <div className="font-medium">{member.phone}</div>
                </div>
              </div>
              {member.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Email</div>
                    <div className="font-medium">{member.email}</div>
                  </div>
                </div>
              )}
              {member.alternatePhone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Alternate Phone</div>
                    <div className="font-medium">{member.alternatePhone}</div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Joined Date</div>
                  <div className="font-medium">{member.joinedDate}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 text-gray-400 flex items-center justify-center">
                  <span className="text-xs font-bold">₹</span>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Monthly Income</div>
                  <div className="font-medium">
                    {member.monthlyIncome ? `₹${parseInt(member.monthlyIncome).toLocaleString()}` : 'Not provided'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Address & Other Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Address & Other Details</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                <div>
                  <div className="text-sm text-gray-500">Address</div>
                  <div className="font-medium">{member.address}</div>
                </div>
              </div>
              {member.occupation && (
                <div>
                  <div className="text-sm text-gray-500">Occupation</div>
                  <div className="font-medium">{member.occupation}</div>
                </div>
              )}
              {member.aadhaarNumber && (
                <div>
                  <div className="text-sm text-gray-500">Aadhaar Number</div>
                  <div className="font-medium">{member.aadhaarNumber}</div>
                </div>
              )}
              {member.panNumber && (
                <div>
                  <div className="text-sm text-gray-500">PAN Number</div>
                  <div className="font-medium">{member.panNumber}</div>
                </div>
              )}
            </div>
          </div>

          {/* Nominee Details */}
          {member.nomineeDetails && member.nomineeDetails.name && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Nominee Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Nominee Name</div>
                  <div className="font-medium">{member.nomineeDetails.name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Relation</div>
                  <div className="font-medium">{member.nomineeDetails.relation}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Phone</div>
                  <div className="font-medium">{member.nomineeDetails.phone}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status</h3>
            <div className="space-y-3">
              <div>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  member.status === 'active' 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {member.status}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Member since {member.joinedDate}
              </div>
            </div>
          </div>

          {/* Loans Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              Loans ({loans.length})
            </h3>
            {loans.length > 0 ? (
              <div className="space-y-3">
                {loans.slice(0, 3).map((loan) => (
                  <div key={loan.id} className="border-l-4 border-blue-500 pl-3">
                    <div className="text-sm font-medium">{loan.loanId}</div>
                    <div className="text-sm text-gray-600">₹{loan.amount?.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">{loan.status}</div>
                  </div>
                ))}
                {loans.length > 3 && (
                  <div className="text-sm text-blue-600">+{loans.length - 3} more loans</div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No loans found</div>
            )}
          </div>

          {/* Savings Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-green-600" />
              Savings ({savings.length})
            </h3>
            {savings.length > 0 ? (
              <div className="space-y-3">
                {savings.map((saving) => (
                  <div key={saving.id} className="border-l-4 border-green-500 pl-3">
                    <div className="text-sm font-medium">{saving.accountId}</div>
                    <div className="text-sm text-gray-600">₹{saving.balance?.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">{saving.status}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No savings accounts found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}