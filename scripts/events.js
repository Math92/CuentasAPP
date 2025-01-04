import { state, saveState, loadState } from './states.js';
import { createRecordCard, createFixedExpenseCard } from './cards.js';
import { DebtRecord, FixedExpense } from './base.js';

// Función para registrar un nuevo pago
export function registerPayment(recordId, loanId, amount, date, details) {
    const record = [...state.debtors, ...state.creditors]
        .find(r => r.id === recordId);
    
    if (record) {
        try {
            record.addPaymentToLoan(loanId, amount, date, details);
            saveState();
            updateUI();
        } catch (error) {
            console.error('Error al registrar el pago:', error);
            alert('Error al registrar el pago. Por favor, intente nuevamente.');
        }
    }
}

// Función para mostrar el formulario de nuevo préstamo
function showAddLoanForm(recordId, parentElement) {
    // Eliminar formulario existente si hay uno
    const existingForm = parentElement.querySelector('.add-loan-form');
    if (existingForm) existingForm.remove();

    const form = document.createElement('div');
    form.className = 'add-loan-form';
    form.innerHTML = `
        <form class="loan-form">
            <div class="form-group">
                <label>Monto:</label>
                <input type="number" step="0.01" class="amount-input" required>
            </div>
            <div class="form-group">
                <label>Fecha:</label>
                <input type="date" class="date-input" required value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
                <label>Descripción/Razón:</label>
                <input type="text" class="description-input" required>
            </div>
            <div class="form-actions">
                <button type="submit">Guardar</button>
                <button type="button" class="cancel-btn">Cancelar</button>
            </div>
        </form>
    `;
    
    const loanForm = form.querySelector('form');
    const cancelBtn = form.querySelector('.cancel-btn');
    
    loanForm.onsubmit = (e) => {
        e.preventDefault();
        const amount = e.target.querySelector('.amount-input').value;
        const date = e.target.querySelector('.date-input').value;
        const description = e.target.querySelector('.description-input').value;
        
        const record = [...state.debtors, ...state.creditors].find(r => r.id === recordId);
        
        if (record) {
            record.addLoan(amount, date, description);
            saveState();
            updateUI();
        }
        
        form.remove();
    };
    
    cancelBtn.onclick = () => form.remove();
    
    parentElement.appendChild(form);
}

// events.js
export function updateMonthlyOverview() {
    const selectedMonth = document.getElementById('overview-month')?.value;
    if (!selectedMonth) return;

    // Deudores
    const debtorsSummary = document.getElementById('debtors-summary');
    debtorsSummary.innerHTML = '';
    let totalIncoming = 0;

    state.debtors.forEach(debtor => {
        const overview = debtor.getMonthlyOverview(selectedMonth);
        totalIncoming += overview.totalOwed;
        
        debtorsSummary.innerHTML += `
            <div class="summary-item">
                <div class="summary-person">
                    <span class="person-name">${debtor.name}</span>
                    <span class="total-owed">Saldo: $${overview.totalOwed.toFixed(2)}</span>
                </div>
            </div>
        `;
    });

    // Acreedores
    const creditorsSummary = document.getElementById('creditors-summary');
    creditorsSummary.innerHTML = '';
    let totalOutgoing = 0;

    state.creditors.forEach(creditor => {
        const overview = creditor.getMonthlyOverview(selectedMonth);
        totalOutgoing += overview.totalOwed;
        
        creditorsSummary.innerHTML += `
            <div class="summary-item">
                <div class="summary-person">
                    <span class="person-name">${creditor.name}</span>
                    <span class="total-owed">Saldo: $${overview.totalOwed.toFixed(2)}</span>
                </div>
            </div>
        `;
    });

    // Gastos Fijos
    const fixedExpensesSummary = document.getElementById('fixed-expenses-summary');
    fixedExpensesSummary.innerHTML = '';
    let totalFixed = 0;

    state.fixedExpenses.forEach(expense => {
        const isPaid = expense.isMonthPaid(selectedMonth);
        if (!isPaid) totalFixed += expense.amount;
        
        fixedExpensesSummary.innerHTML += `
            <div class="summary-item ${isPaid ? 'paid' : 'pending'}">
                <div class="expense-info">
                    <span class="expense-name">${expense.name}</span>
                    <span class="expense-amount">$${expense.amount.toFixed(2)}</span>
                    <span class="payment-status ${isPaid ? 'paid' : 'pending'}">
                        ${isPaid ? 'PAGADO' : 'PENDIENTE'}
                    </span>
                </div>
            </div>
        `;
    });

    // Actualizar totales
    document.getElementById('total-to-receive').textContent = `$${totalIncoming.toFixed(2)}`;
    document.getElementById('total-to-pay').textContent = `$${(totalOutgoing + totalFixed).toFixed(2)}`;

    // Balance final
    const balance = totalIncoming - totalOutgoing - totalFixed;
    document.getElementById('monthly-balance').innerHTML = `
        <div class="balance-details">
            <p>Total a Cobrar: $${totalIncoming.toFixed(2)}</p>
            <p>Total a Pagar: $${totalOutgoing.toFixed(2)}</p>
            <p>Gastos Fijos Pendientes: $${totalFixed.toFixed(2)}</p>
            <p class="total-balance ${balance >= 0 ? 'positive' : 'negative'}">
                Balance Final: $${balance.toFixed(2)}
            </p>
        </div>
    `;
}

export function updateUI() {
    // Limpiar y actualizar listas
    const sections = {
        'debtors-list': (list) => {
            state.debtors.forEach(debtor => {
                list.appendChild(createRecordCard(debtor, true));
            });
        },
        'creditors-list': (list) => {
            state.creditors.forEach(creditor => {
                list.appendChild(createRecordCard(creditor, false));
            });
        },
        'fixed-expenses-list': (list) => {
            state.fixedExpenses.forEach(expense => {
                list.appendChild(createFixedExpenseCard(expense));
            });
        }
    };

    Object.entries(sections).forEach(([id, populateFunction]) => {
        const list = document.getElementById(id);
        if (list) {
            list.innerHTML = '';
            populateFunction(list);
        }
    });

    // Actualizar vista general
    updateMonthlyOverview();
}

// En events.js - añadir la función y su exportación
export function clearAllData() {
    state.debtors = [];
    state.creditors = [];
    state.fixedExpenses = [];
    localStorage.removeItem('financeTrackerState');
    updateUI();
}

// También necesitas exportar switchTab que está siendo usada pero no está definida
export function switchTab(tab) {
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

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    
    try {
        // Inicializar en vista general
        switchTab('overview');
        
        // Establecer mes actual
        const currentDate = new Date();
        const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        const overviewMonth = document.getElementById('overview-month');
        if (overviewMonth) {
            overviewMonth.value = currentMonth;
            updateMonthlyOverview();
        }

        updateUI();
    } catch (error) {
        console.error('Error during initialization:', error);
        clearAllData();
    }
});

// Event Listener para formularios
const formIds = {
    'fixed-expense-form': (e) => {
        e.preventDefault();
        const expense = new FixedExpense(
            document.getElementById('expense-name').value,
            document.getElementById('expense-amount').value,
            document.getElementById('expense-day').value,
            document.getElementById('expense-details').value
        );
        state.fixedExpenses.push(expense);
        saveState();
        updateUI();
        e.target.reset();
        switchTab('overview');
    },
    'debtor-form': (e) => {
        e.preventDefault();
        const debtor = new DebtRecord(
            document.getElementById('debtor-name').value,
            document.getElementById('debtor-details').value
        );
        
        // Agregar el primer préstamo
        debtor.addLoan(
            document.getElementById('debt-amount').value,
            document.getElementById('start-date').value,
            document.getElementById('debtor-details').value
        );
        
        state.debtors.push(debtor);
        saveState();
        updateUI();
        e.target.reset();
        switchTab('overview');
    },
    'creditor-form': (e) => {
        e.preventDefault();
        const creditor = new DebtRecord(
            document.getElementById('creditor-name').value,
            document.getElementById('creditor-details').value
        );
        
        // Agregar el primer préstamo
        creditor.addLoan(
            document.getElementById('credit-amount').value,
            document.getElementById('credit-date').value,
            document.getElementById('creditor-details').value
        );
        
        state.creditors.push(creditor);
        saveState();
        updateUI();
        e.target.reset();
        switchTab('overview');
    }
};

Object.entries(formIds).forEach(([id, handler]) => {
    const form = document.getElementById(id);
    if (form) {
        form.addEventListener('submit', handler);
    }
});


// Exportar las funciones que necesitan ser globales para el HTML
window.switchTab = switchTab;
window.updateMonthlyOverview = updateMonthlyOverview;