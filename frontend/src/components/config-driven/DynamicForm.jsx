import React from 'react'
import { useConfig } from '../../context/ConfigContext'

/**
 * Input component
 */
function Input({ label, value, onChange, error, required, type = 'text', onBlur, ...props }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}

/**
 * Renders form fields based on config
 */
export function DynamicMemberForm({ data, onChange, errors }) {
  const { memberConfig, config } = useConfig()
  
  const validationRules = config.validation

  const validateField = (field, value) => {
    const rule = validationRules[field]
    if (!rule) return null
    
    const regex = new RegExp(rule.pattern)
    if (!regex.test(value)) {
      return rule.message
    }
    return null
  }

  const handleFieldChange = (field, value) => {
    onChange(field, value)
    // Clear error when user starts typing
    if (errors[field]) {
      onChange(`${field}Error`, null)
    }
  }

  const handleFieldBlur = (field) => {
    if (data[field]) {
      const error = validateField(field, data[field])
      if (error) onChange(`${field}Error`, error)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Member Information</h3>
        
        {/* Required Fields */}
        {memberConfig.requiredFields.map(field => (
          <Input
            key={field}
            label={fieldLabels[field]}
            value={data[field] || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            error={errors[`${field}Error`]}
            required
            type={fieldTypes[field] || 'text'}
            onBlur={() => handleFieldBlur(field)}
          />
        ))}
      </div>

      {/* Optional Fields */}
      {memberConfig.optionalFields && memberConfig.optionalFields.length > 0 && (
        <div className="border-t pt-4 mt-6">
          <h4 className="text-sm font-medium text-gray-500 mb-3">Optional Information</h4>
          {memberConfig.optionalFields.map(field => (
            <Input
              key={field}
              label={fieldLabels[field]}
              value={data[field] || ''}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              error={errors[`${field}Error`]}
              type={fieldTypes[field] || 'text'}
              onBlur={() => handleFieldBlur(field)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Document upload form based on config
 */
export function DocumentUploadForm({ documents, onDocumentChange, errors }) {
  const { memberConfig } = useConfig()
  
  const handleFileChange = (docId, files) => {
    onDocumentChange(docId, files)
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Document Upload</h3>
      
      {/* Required Documents */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Required Documents</h4>
        {memberConfig.documents.required.map(doc => (
          <div key={doc.id} className="mb-4 p-4 border rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {doc.label}
              <span className="text-red-500 ml-1">*</span>
              {doc.count && <span className="text-gray-500 ml-2">({doc.count} files)</span>}
            </label>
            <input
              type="file"
              accept={doc.accept}
              multiple={doc.count > 1}
              onChange={(e) => handleFileChange(doc.id, e.target.files)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Max size: {(doc.maxSize / (1024 * 1024)).toFixed(1)}MB
            </p>
            {errors[doc.id] && (
              <p className="text-sm text-red-600 mt-1">{errors[doc.id]}</p>
            )}
          </div>
        ))}
      </div>

      {/* Optional Documents */}
      {memberConfig.documents.optional && memberConfig.documents.optional.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-3">Optional Documents</h4>
          {memberConfig.documents.optional.map(doc => (
            <div key={doc.id} className="mb-4 p-4 border border-gray-200 rounded-lg">
              <label className="block text-sm font-medium text-gray-600 mb-2">
                {doc.label}
                {doc.count && <span className="text-gray-500 ml-2">({doc.count} files)</span>}
              </label>
              <input
                type="file"
                accept={doc.accept}
                multiple={doc.count > 1}
                onChange={(e) => handleFileChange(doc.id, e.target.files)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Max size: {(doc.maxSize / (1024 * 1024)).toFixed(1)}MB
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const fieldLabels = {
  name: 'Full Name',
  phone: 'Mobile Number',
  email: 'Email Address',
  address: 'Address',
  alternatePhone: 'Alternate Phone',
  occupation: 'Occupation',
  monthlyIncome: 'Monthly Income',
  referredBy: 'Referred By',
}

const fieldTypes = {
  email: 'email',
  phone: 'tel',
  alternatePhone: 'tel',
  monthlyIncome: 'number',
}