import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { useConfig } from './context/ConfigContext'
import { Sidebar } from './components/common/Sidebar'
import { Header } from './components/common/Header'
import { Dashboard } from './pages/Dashboard'
import { MembersPage } from './pages/MembersPage'
import { NewMemberPage } from './pages/NewMemberPage'
import { ViewMemberPage } from './pages/ViewMemberPage'
import { EditMemberPage } from './pages/EditMemberPage'
import { LoansPage } from './pages/LoansPage'
import { NewLoanPage } from './pages/NewLoanPage'
import { ViewLoanPage } from './pages/ViewLoanPage'
import { EditLoanPage } from './pages/EditLoanPage'
import { PaymentsPage } from './pages/PaymentsPage'
import { NewPaymentPage } from './pages/NewPaymentPage'
import { ReceiptsPage } from './pages/ReceiptsPage'
import { SavingsPage } from './pages/SavingsPage'
import { ReportsPage } from './pages/ReportsPage'
import { RemindersPage } from './pages/RemindersPage'
import { SettingsPage } from './pages/SettingsPage'

function App() {
  const { theme } = useConfig()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Apply theme colors via CSS variables */}
      <style>
        {`
          :root {
            --color-primary: ${theme?.primaryColor || '#16a34a'};
            --color-secondary: ${theme?.secondaryColor || '#ca8a04'};
            --color-accent: ${theme?.accentColor || '#2563eb'};
            --color-danger: ${theme?.dangerColor || '#dc2626'};
          }
        `}
      </style>

      <div className="flex min-h-screen">
        <Sidebar />
        
        <div className="flex-1 flex flex-col">
          <Header />
          
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/members" element={<MembersPage />} />
              <Route path="/members/new" element={<NewMemberPage />} />
              <Route path="/members/:id" element={<ViewMemberPage />} />
              <Route path="/members/:id/edit" element={<EditMemberPage />} />
              <Route path="/loans" element={<LoansPage />} />
              <Route path="/loans/new" element={<NewLoanPage />} />
              <Route path="/loans/:id" element={<ViewLoanPage />} />
              <Route path="/loans/:id/edit" element={<EditLoanPage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/payments/new" element={<NewPaymentPage />} />
              <Route path="/receipts" element={<ReceiptsPage />} />
              <Route path="/savings" element={<SavingsPage />} />
              <Route path="/reminders" element={<RemindersPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<div className="p-6">404 - Page Not Found</div>} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  )
}

export default App