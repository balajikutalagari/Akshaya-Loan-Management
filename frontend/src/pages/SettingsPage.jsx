import React, { useState, useEffect } from 'react'
import { Settings, Building2, CreditCard, DollarSign, User, Palette, Bell, FileText, Save } from 'lucide-react'

export function SettingsPage() {
  const [config, setConfig] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState('society')

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/config')
      const data = await response.json()
      
      // Convert address object to string if it exists
      if (data.society && typeof data.society.address === 'object') {
        const addr = data.society.address
        const addressParts = []
        if (addr.line1) addressParts.push(addr.line1)
        if (addr.line2) addressParts.push(addr.line2)
        if (addr.city) addressParts.push(addr.city)
        if (addr.state) addressParts.push(addr.state)
        if (addr.pincode) addressParts.push(addr.pincode)
        if (addr.country) addressParts.push(addr.country)
        data.society.address = addressParts.join(', ')
      }
      
      // Extract phone and email from contact object if it exists
      if (data.society && data.society.contact) {
        if (data.society.contact.phone) {
          data.society.phone = data.society.contact.phone
        }
        if (data.society.contact.email) {
          data.society.email = data.society.contact.email
        }
      }
      
      setConfig(data)
    } catch (err) {
      setError('Failed to load configuration')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      
      // Prepare config for saving
      const configToSave = { ...config }
      
      // Convert address string back to object if needed
      if (configToSave.society && typeof configToSave.society.address === 'string') {
        const addressStr = configToSave.society.address
        const parts = addressStr.split(',').map(p => p.trim())
        
        // Create address object
        const addressObj = {}
        if (parts[0]) addressObj.line1 = parts[0]
        if (parts[1]) addressObj.line2 = parts[1]
        if (parts[2]) addressObj.city = parts[2]
        if (parts[3]) addressObj.state = parts[3]
        if (parts[4]) addressObj.pincode = parts[4]
        if (parts[5]) addressObj.country = parts[5]
        
        configToSave.society.address = addressObj
      }
      
      // Add contact object if phone or email exists
      if (configToSave.society) {
        if (!configToSave.society.contact) {
          configToSave.society.contact = {}
        }
        if (configToSave.society.phone) {
          configToSave.society.contact.phone = configToSave.society.phone
        }
        if (configToSave.society.email) {
          configToSave.society.contact.email = configToSave.society.email
        }
      }
      
      const response = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configToSave)
      })

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        throw new Error('Failed to save configuration')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const updateConfig = (section, field, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  const updateNestedConfig = (section, subsection, field, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: {
          ...prev[section]?.[subsection],
          [field]: value
        }
      }
    }))
  }

  const tabs = [
    { id: 'society', label: 'Society Info', icon: Building2 },
    { id: 'fees', label: 'Fees & Charges', icon: DollarSign },
    { id: 'loan', label: 'Loan Settings', icon: CreditCard },
    { id: 'member', label: 'Member Settings', icon: User },
    { id: 'ui', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ]

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="h-8 w-8 text-green-600" />
            Settings
          </h1>
          <p className="text-gray-600 mt-1">Configure system settings and preferences</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>
              <Save size={16} />
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-600">Settings saved successfully!</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Tabs */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Settings Categories</h2>
            </div>
            <nav className="p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow">
            {/* Society Settings */}
            {activeTab === 'society' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-green-600" />
                  Society Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Society Name</label>
                    <input
                      type="text"
                      value={config.society?.name || ''}
                      onChange={(e) => updateConfig('society', 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Short Name</label>
                    <input
                      type="text"
                      value={config.society?.shortName || ''}
                      onChange={(e) => updateConfig('society', 'shortName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <textarea
                      value={config.society?.address || ''}
                      onChange={(e) => updateConfig('society', 'address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="text"
                      value={config.society?.phone || ''}
                      onChange={(e) => updateConfig('society', 'phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={config.society?.email || ''}
                      onChange={(e) => updateConfig('society', 'email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Registration Number</label>
                    <input
                      type="text"
                      value={config.society?.registrationNumber || ''}
                      onChange={(e) => updateConfig('society', 'registrationNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Established Date</label>
                    <input
                      type="date"
                      value={config.society?.establishedDate || ''}
                      onChange={(e) => updateConfig('society', 'establishedDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Fees Settings */}
            {activeTab === 'fees' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Fees & Charges
                </h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Membership Fee</label>
                      <input
                        type="number"
                        value={config.fees?.membership?.amount || ''}
                        onChange={(e) => updateNestedConfig('fees', 'membership', 'amount', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Share Capital</label>
                      <input
                        type="number"
                        value={config.fees?.shareCapital?.amount || ''}
                        onChange={(e) => updateNestedConfig('fees', 'shareCapital', 'amount', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Processing Fee</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                        <select
                          value={config.fees?.processingFee?.type || 'percentage'}
                          onChange={(e) => updateNestedConfig('fees', 'processingFee', 'type', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                          <option value="percentage">Percentage</option>
                          <option value="fixed">Fixed Amount</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Value</label>
                        <input
                          type="number"
                          step="0.1"
                          value={config.fees?.processingFee?.value || ''}
                          onChange={(e) => updateNestedConfig('fees', 'processingFee', 'value', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Max Amount</label>
                        <input
                          type="number"
                          value={config.fees?.processingFee?.maxAmount || ''}
                          onChange={(e) => updateNestedConfig('fees', 'processingFee', 'maxAmount', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Late Fee (per day)</label>
                    <input
                      type="number"
                      value={config.fees?.lateFee?.value || ''}
                      onChange={(e) => updateNestedConfig('fees', 'lateFee', 'value', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent max-w-md"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Loan Settings */}
            {activeTab === 'loan' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-green-600" />
                  Loan Settings
                </h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Interest Rates</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Default Interest Rate (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={config.loan?.interest?.defaultRate || ''}
                          onChange={(e) => updateNestedConfig('loan', 'interest', 'defaultRate', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Calculation Method</label>
                        <select
                          value={config.loan?.interest?.calculationMethod || 'reducing'}
                          onChange={(e) => updateNestedConfig('loan', 'interest', 'calculationMethod', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                          <option value="reducing">Reducing Balance</option>
                          <option value="flat">Flat Rate</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Loan Limits</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Amount</label>
                        <input
                          type="number"
                          value={config.loan?.amount?.min || ''}
                          onChange={(e) => updateNestedConfig('loan', 'amount', 'min', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Amount</label>
                        <input
                          type="number"
                          value={config.loan?.amount?.max || ''}
                          onChange={(e) => updateNestedConfig('loan', 'amount', 'max', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Tenure Settings</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Tenure (months)</label>
                        <input
                          type="number"
                          value={config.loan?.tenure?.min || ''}
                          onChange={(e) => updateNestedConfig('loan', 'tenure', 'min', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Tenure (months)</label>
                        <input
                          type="number"
                          value={config.loan?.tenure?.max || ''}
                          onChange={(e) => updateNestedConfig('loan', 'tenure', 'max', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Member Settings */}
            {activeTab === 'member' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="h-5 w-5 text-green-600" />
                  Member Settings
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Member ID Prefix</label>
                    <input
                      type="text"
                      value={config.member?.idFormat?.prefix || ''}
                      onChange={(e) => updateNestedConfig('member', 'idFormat', 'prefix', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent max-w-md"
                      placeholder="e.g., MEM"
                    />
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Required Fields</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {['phone', 'email', 'address', 'dateOfBirth', 'occupation'].map((field) => (
                        <label key={field} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={config.member?.validation?.required?.includes(field) || false}
                            onChange={(e) => {
                              const current = config.member?.validation?.required || []
                              const updated = e.target.checked 
                                ? [...current, field]
                                : current.filter(f => f !== field)
                              updateNestedConfig('member', 'validation', 'required', updated)
                            }}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <span className="text-sm capitalize">{field.replace(/([A-Z])/g, ' $1')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* UI Settings */}
            {activeTab === 'ui' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Palette className="h-5 w-5 text-green-600" />
                  Appearance Settings
                </h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Theme Colors</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                        <input
                          type="color"
                          value={config.ui?.theme?.primaryColor || '#16a34a'}
                          onChange={(e) => updateNestedConfig('ui', 'theme', 'primaryColor', e.target.value)}
                          className="w-full h-10 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
                        <input
                          type="color"
                          value={config.ui?.theme?.secondaryColor || '#ca8a04'}
                          onChange={(e) => updateNestedConfig('ui', 'theme', 'secondaryColor', e.target.value)}
                          className="w-full h-10 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
                        <input
                          type="color"
                          value={config.ui?.theme?.accentColor || '#2563eb'}
                          onChange={(e) => updateNestedConfig('ui', 'theme', 'accentColor', e.target.value)}
                          className="w-full h-10 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Danger Color</label>
                        <input
                          type="color"
                          value={config.ui?.theme?.dangerColor || '#dc2626'}
                          onChange={(e) => updateNestedConfig('ui', 'theme', 'dangerColor', e.target.value)}
                          className="w-full h-10 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Display Settings</h4>
                    <div className="space-y-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={config.ui?.theme?.showLogoInSidebar || false}
                          onChange={(e) => updateNestedConfig('ui', 'theme', 'showLogoInSidebar', e.target.checked)}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-sm">Show logo in sidebar</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={config.ui?.theme?.showMemberPhotos || false}
                          onChange={(e) => updateNestedConfig('ui', 'theme', 'showMemberPhotos', e.target.checked)}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-sm">Show member photos</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeTab === 'notifications' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Bell className="h-5 w-5 text-green-600" />
                  Notification Settings
                </h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Reminder Settings</h4>
                    <div className="space-y-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={config.reminders?.payment?.enabled || false}
                          onChange={(e) => updateNestedConfig('reminders', 'payment', 'enabled', e.target.checked)}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-sm">Enable payment reminders</span>
                      </label>
                      <div className="ml-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Days before due date</label>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={config.reminders?.payment?.daysBefore || 3}
                          onChange={(e) => updateNestedConfig('reminders', 'payment', 'daysBefore', parseInt(e.target.value))}
                          className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Auto-generation</h4>
                    <div className="space-y-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={config.reminders?.autoGenerate?.payments || false}
                          onChange={(e) => updateNestedConfig('reminders', 'autoGenerate', 'payments', e.target.checked)}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-sm">Auto-generate payment reminders</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={config.reminders?.autoGenerate?.overdue || false}
                          onChange={(e) => updateNestedConfig('reminders', 'autoGenerate', 'overdue', e.target.checked)}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-sm">Auto-generate overdue reminders</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}