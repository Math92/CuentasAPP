import { Loan, DebtRecord, FixedExpense } from './base.js';


// Estado de la aplicación
export const state = {
    debtors: [],
    creditors: [],
    fixedExpenses: [],
    currentTab: 'overview'
};

// Función para convertir objetos planos a instancias de clase
export function convertToInstance(obj, type) {
    if (!obj) return null;

    let instance;
    
    switch(type) {
        case 'FixedExpense':
            instance = new FixedExpense(
                obj.name,
                obj.amount,
                obj.paymentDay,
                obj.details
            );
            instance.id = obj.id;
            instance.history = obj.history || [];
            instance.payments = obj.payments || {};
            break;
            
        case 'DebtRecord':
            instance = new DebtRecord(
                obj.name,
                obj.details
            );
            instance.id = obj.id;
            
            // Convertir los préstamos
            if (obj.loans && Array.isArray(obj.loans)) {
                instance.loans = obj.loans.map(loanObj => {
                    const loan = new Loan(
                        loanObj.amount,
                        loanObj.startDate,
                        loanObj.description
                    );
                    loan.id = loanObj.id;
                    loan.payments = loanObj.payments || [];
                    loan.remainingAmount = loanObj.remainingAmount;
                    loan.status = loanObj.status || 'active';
                    return loan;
                });
            }
            
            instance.totalOwed = obj.totalOwed || 0;
            instance.updateTotalOwed();
            break;
    }
    
    return instance;
}

// Funciones auxiliares
export function getNext12Months() {
    const months = [];
    const today = new Date();
    
    for (let i = 0; i < 12; i++) {
        const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        months.push(`${year}-${month}`);
    }
    return months;
}

export function isMonthCurrentOrFuture(yearMonth) {
    const today = new Date();
    const [year, month] = yearMonth.split('-').map(Number);
    const checkDate = new Date(year, month - 1);
    const firstDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return checkDate >= firstDayOfCurrentMonth;
}

// Funciones de persistencia
export function saveState() {
    try {
        localStorage.setItem('financeTrackerState', JSON.stringify(state));
    } catch (error) {
        console.error('Error saving state:', error);
    }
}

export function loadState() {
    try {
        const savedState = localStorage.getItem('financeTrackerState');
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            
            state.debtors = (parsedState.debtors || [])
                .map(obj => convertToInstance(obj, 'DebtRecord'))
                .filter(Boolean);
                
            state.creditors = (parsedState.creditors || [])
                .map(obj => convertToInstance(obj, 'DebtRecord'))
                .filter(Boolean);
                
            state.fixedExpenses = (parsedState.fixedExpenses || [])
                .map(obj => convertToInstance(obj, 'FixedExpense'))
                .filter(Boolean);
        }
    } catch (error) {
        console.error('Error loading state:', error);
        clearAllData();
    }
}

function clearAllData() {
    state.debtors = [];
    state.creditors = [];
    state.fixedExpenses = [];
    localStorage.removeItem('financeTrackerState');
    updateUI();
}

// Función para cambiar entre pestañas
function switchTab(tab) {
    state.currentTab = tab;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`button[onclick="switchTab('${tab}')"]`).classList.add('active');
    
    ['debtors-section', 'creditors-section', 'fixed-expenses-section', 'overview-section'].forEach(section => {
        document.getElementById(section).style.display = 'none';
    });
    
    document.getElementById(`${tab}-section`).style.display = 'block';
    
    if (tab === 'overview') {
        updateMonthlyOverview();
    }
}