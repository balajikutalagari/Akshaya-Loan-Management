import React from 'react'
import { NavLink } from 'react-router-dom'
import { useConfig } from '../../context/ConfigContext'
import * as Icons from 'lucide-react'

export function Sidebar() {
  const { navigation, theme, society } = useConfig()

  return (
    <aside className="w-72 bg-white border-r border-gray-200 flex flex-col shadow-sm">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          {theme?.showLogoInSidebar && society?.logo && (
            <img 
              src={society.logo} 
              alt={society.shortName} 
              className="h-8 w-8 rounded-lg" 
            />
          )}
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              {society?.shortName || 'Akshaya'}
            </h1>
            <p className="text-xs text-gray-500">Loan Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 flex-1">
        <div className="space-y-1">
          {navigation?.map(item => {
            const Icon = Icons[item.icon] || Icons.Circle
            
            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive 
                      ? 'bg-green-50 text-green-700 border border-green-100' 
                      : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'
                  }`
                }
              >
                <Icon size={20} className={`transition-colors`} />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100">
        <div className="text-xs text-gray-500 text-center">
          <p className="font-medium">{society?.name || 'Society Name'}</p>
          <p className="mt-1">v1.0.0</p>
        </div>
      </div>
    </aside>
  )
}