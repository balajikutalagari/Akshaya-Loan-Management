# Akshaya - Configurable Loan Management Desktop App

A white-label, configurable loan management system for cooperative thrift & credit societies built with Pear.

## Features

- **100% Configurable**: Adapt for any society by editing just one config file
- **Offline-First**: Works completely offline with local data storage
- **Desktop App**: Native desktop experience with Pear
- **Config-Driven UI**: Dynamic forms, navigation, and business rules
- **Loan Management**: Complete loan lifecycle management
- **Member Management**: Member registration and document handling
- **EMI Scheduling**: Automatic EMI schedule generation
- **Payment Processing**: Multiple payment modes with receipt generation
- **Savings Tracking**: Optional savings with interest calculation
- **Reminders**: Automated payment reminders
- **Reports**: Configurable reports and exports

## Quick Start

### 1. Install Dependencies

```bash
# Install Pear CLI globally
npm install -g pear

# Install project dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure Your Society

Edit `config/society.config.js` to customize for your society:

```javascript
module.exports = {
  society: {
    name: "Your Society Name",
    shortName: "Your Society",
    // ... update all society details
  },
  fees: {
    membershipFee: { amount: 100 },    // Change fees
    processingFee: { value: 1.5 },     // Change rates
  },
  loan: {
    interest: { defaultRate: 2.0 },    // Change interest
    // ... customize loan terms
  }
  // ... customize everything
}
```

### 3. Run the Application

```bash
# Development mode
npm run dev

# Build and run
npm run build
npm start
```

## Configuration Guide

### Adapting for a New Society

1. **Copy the config file**:
   ```bash
   cp config/society.config.js config/my-society.config.js
   ```

2. **Update society information**:
   - Name, address, contact details
   - Registration number
   - Logo and branding

3. **Configure fees**:
   - Membership fees
   - Processing fees
   - Late payment penalties
   - Share capital requirements

4. **Set loan parameters**:
   - Interest rates and slabs
   - Loan amount limits
   - Tenure options
   - EMI components

5. **Customize UI**:
   - Theme colors
   - Navigation items
   - Dashboard widgets

6. **Set business rules**:
   - Eligibility criteria
   - Validation patterns
   - Approval workflows

### Key Configuration Sections

| Section | Purpose | Examples |
|---------|---------|----------|
| `society` | Basic society info | Name, address, logo |
| `fees` | All fee structures | Membership, processing, late fees |
| `savings` | Savings configuration | Interest rates, mandatory amounts |
| `loan` | Loan parameters | Interest rates, tenure, limits |
| `member` | Member requirements | Required fields, documents |
| `ui` | User interface | Colors, navigation, widgets |
| `templates` | Print templates | Receipt, loan schedule formats |
| `validation` | Data validation | Phone, email, ID patterns |

## Architecture

```
┌─────────────────────────────────────────────────┐
│                PEAR DESKTOP APP                 │
├─────────────────────────────────────────────────┤
│  Frontend (React)     │     Backend (Node.js)   │
│  - Config Context     │     - Config Service    │
│  - Dynamic Forms      │     - Business Logic    │
│  - Theme System       │     - Database (Hyperbee)│
│  - API Client         │     - Job Scheduler     │
└─────────────────────────────────────────────────┘
```

## File Structure

```
akshaya/
├── config/
│   └── society.config.js       # 🔥 Main configuration
├── backend/
│   ├── models/                 # Data models
│   ├── services/               # Business logic
│   ├── engines/                # Calculation engines
│   ├── api/                    # REST API
│   └── jobs/                   # Background jobs
├── frontend/
│   ├── src/
│   │   ├── context/           # Config context
│   │   ├── components/        # UI components
│   │   └── pages/             # Application pages
│   └── dist/                  # Built frontend
└── storage/                   # Local database
```

## Development

### Adding New Features

1. **Config-driven approach**: Add configuration in `society.config.js`
2. **Backend logic**: Implement in services and engines
3. **Frontend components**: Create config-aware React components
4. **API endpoints**: Add REST endpoints for data operations

### Running Tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

### Building for Production

```bash
# Build everything
npm run build

# Package for distribution
npm run package
```

## Deployment

### Single Society Deployment

1. Configure `config/society.config.js`
2. Build the application: `npm run build`
3. Package with Pear: `npm run package`
4. Distribute the packaged app

### Multi-Society Deployment

Create separate builds for each society:

```bash
# Copy and customize config for each society
cp config/society.config.js config/society-a.config.js
cp config/society.config.js config/society-b.config.js

# Build separate packages
# (This would require build script modifications)
```

## Data Storage

- **Local**: Hyperbee database stored in `storage/`
- **Backup**: Automatic daily backups to `backups/`
- **Sync**: Optional P2P synchronization between devices
- **Export**: Data export in multiple formats

## Security

- All data stored locally on user's device
- No cloud dependencies
- Configurable validation and business rules
- Document storage in local filesystem
- Encrypted backups (optional)

## Customization Examples

### Adding a New Fee Type

```javascript
// In config/society.config.js
fees: {
  // ...existing fees
  insuranceFee: {
    enabled: true,
    amount: 500,
    label: "Insurance Premium",
    refundable: false,
    chargeOn: "disbursement",
  }
}
```

### Changing Interest Calculation

```javascript
// In config/society.config.js
loan: {
  interest: {
    type: "flatRate",           // Change from reducingBalance
    defaultRate: 12,            // Annual rate
    rateType: "annual",         // Change from monthly
  }
}
```

### Custom Validation Rules

```javascript
// In config/society.config.js
validation: {
  phone: {
    pattern: "^\\+1[0-9]{10}$",  // US phone format
    message: "Enter valid US phone number"
  }
}
```

## Support

- **Documentation**: See `docs/` folder for detailed guides
- **Issues**: Report bugs via GitHub issues
- **Discussions**: Use GitHub discussions for questions
- **Config Help**: Check `config/society.config.example.js`

## License

MIT License - see LICENSE file for details.

---

**Zero code changes needed for new society deployment!** 🎯

Just edit the config file and you're ready to go.