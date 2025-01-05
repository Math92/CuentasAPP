# CuentasAPP - Personal Finance Management System 💰

## Overview
CuentasAPP is a full-stack web application for personal finance management, designed to track debts, credits, and fixed expenses. Built with vanilla JavaScript and Firebase Realtime Database, it provides a robust solution for budget tracking and financial planning.

## Tech Stack 🛠️

### Frontend
- **JavaScript (ES6+)**
  - Modular architecture using ES6 modules
  - Class-based OOP implementation
  - Async/Await for API handling
- **HTML5**
  - Semantic markup
  - Form validation
  - Template elements for dynamic content
- **CSS3**
  - Modular CSS architecture
  - CSS Custom Properties (variables)
  - Flexbox and Grid layouts
  - Responsive design
  - Dark theme implementation

### Backend
- **Firebase Realtime Database**
  - NoSQL data structure
  - Real-time data synchronization
  - User authentication
  - Data persistence

## Project Structure 📁

```
CuentasAPP/
├── scripts/
│   ├── auth.js           # Authentication logic
│   ├── base.js           # Core classes (Loan, DebtRecord, FixedExpense)
│   ├── cards.js          # UI components for records
│   ├── events.js         # Event handlers and UI updates
│   ├── firebase-service.js # Firebase integration
│   ├── init.js           # Application initialization
│   └── states.js         # State management
├── styles/
│   ├── auth.css          # Authentication styles
│   ├── base.css          # Base styles
│   ├── buttons.css       # Button components
│   ├── cards.css         # Card components
│   ├── forms.css         # Form styles
│   ├── overview.css      # Dashboard styles
│   ├── responsive.css    # Responsive design
│   ├── tabs.css          # Navigation tabs
│   └── variables.css     # CSS custom properties
└── pages/
    ├── index.html        # Main application
    ├── login.html        # Login page
    └── register.html     # Registration page
```

## Core Features 🌟

### Authentication System
- User registration and login
- Session management
- Secure route protection
- Firebase authentication integration

### Financial Management
1. **Debtors Management**
   - Track multiple loans per debtor
   - Payment history tracking
   - Real-time balance calculation
   - Status tracking (active/completed)

2. **Creditors Management**
   - Credit tracking
   - Payment scheduling
   - Balance monitoring
   - Payment history

3. **Fixed Expenses**
   - Monthly expense tracking
   - Payment date monitoring
   - Status tracking (paid/pending)
   - Historical data maintenance

### Monthly Overview Dashboard
- Comprehensive financial summary
- Income vs. Expense analysis
- Payment schedules
- Monthly balance calculation

## Data Models 📊

### Loan Class
```javascript
class Loan {
    constructor(amount, startDate, description) {
        this.id = Date.now() + Math.random().toString(36).substr(2, 9);
        this.amount = parseFloat(amount);
        this.startDate = startDate;
        this.description = description;
        this.payments = [];
        this.remainingAmount = this.amount;
        this.status = 'active';
    }
}
```

### DebtRecord Class
```javascript
class DebtRecord {
    constructor(name, details = '') {
        this.id = Date.now() + Math.random().toString(36).substr(2, 9);
        this.name = name;
        this.details = details;
        this.loans = [];
        this.totalOwed = 0;
    }
}
```

### FixedExpense Class
```javascript
class FixedExpense {
    constructor(name, amount, paymentDay, details) {
        this.id = Date.now();
        this.name = name;
        this.amount = parseFloat(amount);
        this.paymentDay = parseInt(paymentDay);
        this.details = details;
        this.history = [];
        this.payments = {};
    }
}
```

## Firebase Integration 🔥

### Data Structure
```
/users
  /{userId}
    /debtors
      /{debtorId}
        - name
        - details
        - loans[]
    /creditors
      /{creditorId}
        - name
        - details
        - loans[]
    /fixedExpenses
      /{expenseId}
        - name
        - amount
        - paymentDay
        - payments{}
```

### API Services
- CRUD operations for debtors
- CRUD operations for creditors
- CRUD operations for fixed expenses
- Payment tracking and updates

## UI/UX Features 🎨

### Responsive Design
- Mobile-first approach
- Fluid layouts
- Adaptive components
- Touch-friendly interfaces

### Theme System
- Dark theme implementation
- CSS custom properties for theming
- Consistent color palette
- Accessible color contrasts

### Interactive Components
- Dynamic form validation
- Real-time updates
- Smooth transitions
- Loading states
- Error handling

