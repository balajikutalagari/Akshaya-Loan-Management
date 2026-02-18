import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useConfig } from '../../context/ConfigContext'
import { api } from '../../api/client'
import { 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  Activity, 
  Plus,
  Users,
  Briefcase,
  CreditCard,
  PiggyBank
} from 'lucide-react'

export function DashboardWidgets({ stats }) {
  const { dashboardWidgets, formatCurrency, config } = useConfig()
  const [upcoming, setUpcoming] = React.useState(null)

  React.useEffect(() => {
    // Load upcoming data for widgets
    const loadUpcomingData = async () => {
      try {
        const upcomingData = await api.dashboard.upcoming()
        setUpcoming(upcomingData)
      } catch (error) {
        console.error('Error loading upcoming data:', error)
      }
    }
    loadUpcomingData()
  }, [])

  // Add null check and default to empty array
  const widgets_list = dashboardWidgets || []
  
  // If config is still loading, show a simple stats widget
  if (!config) {
    return (
      <div className="grid gap-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="col-span-full">
            <StatsWidget stats={stats} formatCurrency={formatCurrency} />
          </div>
        </div>
      </div>
    )
  }

  const widgets = {
    stats: <StatsWidget stats={stats} formatCurrency={formatCurrency} />,
    dueCalendar: <DueCalendarWidget upcoming={upcoming} formatCurrency={formatCurrency} />,
    overdueAlerts: <OverdueAlertsWidget upcoming={upcoming} formatCurrency={formatCurrency} />,
    recentTransactions: <RecentTransactionsWidget formatCurrency={formatCurrency} />,
    quickActions: <QuickActionsWidget />,
  }

  return (
    <div className="grid gap-6 mb-8">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {widgets_list
          .filter(w => w.id === 'stats')
          .map(widget => (
            <div key={widget.id} className="col-span-full">
              {widgets[widget.id]}
            </div>
          ))}
      </div>

      {/* Other Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {widgets_list
          .filter(w => w.id !== 'stats')
          .sort((a, b) => a.order - b.order)
          .map(widget => (
            <div key={widget.id}>
              {widgets[widget.id]}
            </div>
          ))}
      </div>
    </div>
  )
}

function StatsWidget({ stats, formatCurrency }) {
  const statsConfig = [
    {
      title: 'Total Members',
      value: stats?.members?.total || 0,
      icon: Users,
      gradient: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      textColor: 'text-blue-600',
    },
    {
      title: 'Active Loans',
      value: stats?.loans?.active || 0,
      icon: Briefcase,
      gradient: 'from-green-500 to-green-600',
      bg: 'bg-green-50',
      iconBg: 'bg-green-100',
      textColor: 'text-green-600',
    },
    {
      title: 'Outstanding Amount',
      value: formatCurrency(stats?.loans?.outstanding || 0),
      icon: CreditCard,
      gradient: 'from-yellow-500 to-yellow-600',
      bg: 'bg-yellow-50',
      iconBg: 'bg-yellow-100',
      textColor: 'text-yellow-600',
    },
    {
      title: 'Total Savings',
      value: formatCurrency(stats?.savings?.total || 0),
      icon: PiggyBank,
      gradient: 'from-purple-500 to-purple-600',
      bg: 'bg-purple-50',
      iconBg: 'bg-purple-100',
      textColor: 'text-purple-600',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsConfig.map((stat, index) => (
        <div key={index} className={`${stat.bg} rounded-xl border border-white/20 p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
              <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
            </div>
            <div className={`${stat.iconBg} rounded-full p-3`}>
              <stat.icon className={`h-6 w-6 ${stat.textColor}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function DueCalendarWidget({ upcoming, formatCurrency }) {
  const navigate = useNavigate()
  const todayDue = upcoming?.today || []
  const todayAmount = todayDue.reduce((sum, loan) => sum + (loan.dueAmount || 0), 0)
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
          <div className="bg-green-100 rounded-lg p-2">
            <Calendar className="h-5 w-5 text-green-600" />
          </div>
          Payment Calendar
        </h3>
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
          <div>
            <p className="text-sm font-semibold text-blue-900">Today</p>
            <p className="text-xs text-blue-600">{todayDue.length} payments due</p>
          </div>
          <span className="text-lg font-bold text-blue-700">{formatCurrency ? formatCurrency(todayAmount) : `₹${todayAmount}`}</span>
        </div>
        
        <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
          <div>
            <p className="text-sm font-semibold text-yellow-900">Tomorrow</p>
            <p className="text-xs text-yellow-600">0 payments due</p>
          </div>
          <span className="text-lg font-bold text-yellow-700">₹0</span>
        </div>
        
        <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
          <div>
            <p className="text-sm font-semibold text-green-900">This Week</p>
            <p className="text-xs text-green-600">0 payments scheduled</p>
          </div>
          <span className="text-lg font-bold text-green-700">₹0</span>
        </div>
      </div>
      
      <button 
        onClick={() => navigate('/loans')}
        className="w-full mt-6 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
      >
        View Full Calendar
      </button>
    </div>
  )
}

function OverdueAlertsWidget({ upcoming, formatCurrency }) {
  const overdueLoans = upcoming?.overdue || []
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          Overdue Alerts
        </h3>
      </div>
      
      <div className="space-y-3">
        {overdueLoans.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500">No overdue loans</p>
          </div>
        ) : (
          overdueLoans.slice(0, 5).map((loan) => (
            <div key={loan.loanId} className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-red-800">{loan.memberName} ({loan.memberId})</p>
                  <p className="text-sm text-red-600">{loan.loanId}</p>
                </div>
                <span className="text-red-700 font-semibold">{formatCurrency(loan.overdueAmount || 0)}</span>
              </div>
            </div>
          ))
        )}
      </div>
      
      {overdueLoans.length > 0 && (
        <button className="w-full mt-4 text-red-600 text-sm font-medium hover:text-red-700">
          View All Overdue ({overdueLoans.length}) →
        </button>
      )}
    </div>
  )
}

function RecentTransactionsWidget({ formatCurrency }) {
  const navigate = useNavigate()
  const [transactions, setTransactions] = React.useState([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const loadRecentTransactions = async () => {
      try {
        console.log('Fetching recent transactions...')
        const recentData = await api.dashboard.recent(5)
        console.log('Recent transactions received:', recentData)
        setTransactions(recentData)
      } catch (error) {
        console.error('Error loading recent transactions:', error)
      } finally {
        setLoading(false)
      }
    }
    loadRecentTransactions()
  }, [])

  const formatTimeAgo = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    
    if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
    } else {
      return 'Just now'
    }
  }

  const getTransactionColor = (type) => {
    switch (type) {
      case 'payment':
        return 'text-green-600'
      case 'disbursement':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          Recent Transactions
        </h3>
      </div>
      
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-4">
            <p className="text-gray-500">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500">No recent transactions</p>
          </div>
        ) : (
          transactions.map((transaction) => (
            <div key={transaction.id} className="flex justify-between items-center p-3 border-b">
              <div>
                <p className="font-medium">{transaction.memberName}</p>
                <p className="text-sm text-gray-500">{transaction.description}</p>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                  {formatCurrency ? formatCurrency(transaction.amount) : `₹${transaction.amount}`}
                </p>
                <p className="text-xs text-gray-500">{formatTimeAgo(transaction.timestamp)}</p>
              </div>
            </div>
          ))
        )}
      </div>
      
      <button 
        onClick={() => navigate('/payments')}
        className="w-full mt-4 text-blue-600 text-sm font-medium hover:text-blue-700 transition-colors"
      >
        View All Transactions →
      </button>
    </div>
  )
}

function QuickActionsWidget() {
  const navigate = useNavigate()
  
  const actions = [
    { label: 'Add Member', icon: Users, color: 'bg-blue-500', href: '/members/new' },
    { label: 'New Loan', icon: Briefcase, color: 'bg-green-500', href: '/loans/new' },
    { label: 'Record Payment', icon: CreditCard, color: 'bg-yellow-500', href: '/payments/new' },
    { label: 'Send Reminders', icon: Activity, color: 'bg-purple-500', href: '/reminders' },
  ]

  const handleActionClick = (href) => {
    navigate(href)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Plus className="h-5 w-5 text-gray-600" />
          Quick Actions
        </h3>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => handleActionClick(action.href)}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <div className={`${action.color} rounded-lg p-2`}>
              <action.icon className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}