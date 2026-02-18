import React from 'react'
import { useConfig } from '../../context/ConfigContext'
import { Bell, Settings, User } from 'lucide-react'

export function Header() {
  const { theme, society } = useConfig()

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between shadow-sm">
      {/* Left side - Search or breadcrumb */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search members, loans..." 
            className="w-80 pl-4 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            3
          </span>
        </button>

        {/* Settings */}
        <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Settings size={20} />
        </button>

        {/* User Menu */}
        <div className="flex items-center gap-3 ml-2">
          <div className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
            <div className="bg-green-100 rounded-full p-2">
              <User size={16} className="text-green-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">Admin User</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}