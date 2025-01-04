import { Loan, DebtRecord, FixedExpense } from './base.js';
import { firebaseService } from './firebase-service.js';
import { updateUI, updateMonthlyOverview } from './events.js';

export const state = {
    debtors: [],
    creditors: [],
    fixedExpenses: [],
    currentTab: 'overview'
};

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

export async function saveState() {
    try {
        const savePromises = [
            ...state.debtors.map(async debtor => {
                const savedDebtor = await firebaseService.saveDebtor(debtor);
                return savedDebtor;
            }),
            ...state.creditors.map(async creditor => {
                const savedCreditor = await firebaseService.saveCreditor(creditor);
                return savedCreditor;
            }),
            ...state.fixedExpenses.map(async expense => {
                const savedExpense = await firebaseService.saveFixedExpense(expense);
                return savedExpense;
            })
        ];

        await Promise.all(savePromises);
        await updateUI();
    } catch (error) {
        console.error('Error saving state:', error);
        throw error;
    }
}

export async function loadState() {
    try {
        const [debtors, creditors, fixedExpenses] = await Promise.all([
            firebaseService.getDebtors(),
            firebaseService.getCreditors(),
            firebaseService.getFixedExpenses()
        ]);

        state.debtors = debtors.map(obj => convertToInstance(obj, 'DebtRecord')).filter(Boolean);
        state.creditors = creditors.map(obj => convertToInstance(obj, 'DebtRecord')).filter(Boolean);
        state.fixedExpenses = fixedExpenses.map(obj => convertToInstance(obj, 'FixedExpense')).filter(Boolean);
        
        await updateUI();
    } catch (error) {
        console.error('Error loading state:', error);
        await clearAllData();
    }
}


export async function addPaymentToLoan(debtorId, loanId, payment) {
    try {
        const savedPayment = await firebaseService.saveLoanPayment(debtorId, loanId, payment);
        await updateUI();
        return savedPayment;
    } catch (error) {
        console.error('Error saving payment:', error);
        throw error;
    }
}

export function switchTab(tab) {
    state.currentTab = tab;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`button[onclick="switchTab('${tab}')"]`).classList.add('active');
    
    ['debtors-section', 'creditors-section', 'fixed-expenses-section', 'overview-section']
        .forEach(section => {
            document.getElementById(section).style.display = 'none';
        });
    
    document.getElementById(`${tab}-section`).style.display = 'block';
    
    if (tab === 'overview') {
        updateMonthlyOverview();
    }
}

export { updateUI, updateMonthlyOverview };