// events.js
import { state, saveState, loadState } from './states.js';
import { createRecordCard, createFixedExpenseCard } from './cards.js';
import { DebtRecord, FixedExpense } from './base.js';

// Función para formatear moneda
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS'
    }).format(amount);
};

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

// Vista General Mensual
export function updateMonthlyOverview() {
    const selectedMonth = document.getElementById('overview-month')?.value;
    if (!selectedMonth) return;

    const overviewContainer = document.getElementById('overview-section');
    overviewContainer.innerHTML = `
        <div class="overview-container">
            <h1 class="overview-title">Vista General Mensual</h1>
            
            <!-- Selector de Mes -->
            <div class="month-selector">
                <label for="overview-month">Seleccionar Mes:</label>
                <input type="month" id="overview-month" value="${selectedMonth}" required>
                <button onclick="updateMonthlyOverview()" class="update-btn">Actualizar Vista</button>
            </div>

            <!-- Sección Deudores -->
            <div class="summary-section debtors-section">
                <div class="section-header">
                    <h2>Deudores - Dinero a Recibir</h2>
                </div>
                <div class="section-content" id="debtors-summary">
                    ${generateDebtorsSummary(selectedMonth)}
                </div>
            </div>

            <!-- Sección Acreedores -->
            <div class="summary-section creditors-section">
                <div class="section-header">
                    <h2>Acreedores - Dinero a Pagar</h2>
                </div>
                <div class="section-content" id="creditors-summary">
                    ${generateCreditorsSummary(selectedMonth)}
                </div>
            </div>

            <!-- Sección Gastos Fijos -->
            <div class="summary-section fixed-expenses-section">
                <div class="section-header">
                    <h2>Gastos Fijos del Mes</h2>
                </div>
                <div class="section-content" id="fixed-expenses-summary">
                    ${generateFixedExpensesSummary(selectedMonth)}
                </div>
            </div>

            ${generateBalanceSection()}
        </div>
    `;

    // Re-asignar el evento al selector de mes
    const monthSelector = document.getElementById('overview-month');
    if (monthSelector) {
        monthSelector.value = selectedMonth;
        monthSelector.addEventListener('change', updateMonthlyOverview);
    }
}

// Generar resumen de deudores
function generateDebtorsSummary(selectedMonth) {
    let html = '';
    let totalIncoming = 0;

    state.debtors.forEach(debtor => {
        const overview = debtor.getMonthlyOverview(selectedMonth);
        totalIncoming += overview.totalOwed;
        
        html += `
            <div class="summary-item">
                <div class="item-info">
                    <span class="item-name">${debtor.name}</span>
                    <div class="item-details">
                        <span class="loan-count">Préstamos activos: ${overview.activeLoansCount}</span>
                    </div>
                </div>
                <div class="item-amount">${formatCurrency(overview.totalOwed)}</div>
            </div>
        `;
    });

    window.totalIncoming = totalIncoming; // Para usar en el balance final
    return html || '<div class="empty-state">No hay deudores registrados</div>';
}

// Generar resumen de acreedores
function generateCreditorsSummary(selectedMonth) {
    let html = '';
    let totalOutgoing = 0;

    state.creditors.forEach(creditor => {
        const overview = creditor.getMonthlyOverview(selectedMonth);
        totalOutgoing += overview.totalOwed;
        
        html += `
            <div class="summary-item">
                <div class="item-info">
                    <span class="item-name">${creditor.name}</span>
                    <div class="item-details">
                        <span class="loan-count">Créditos activos: ${overview.activeLoansCount}</span>
                    </div>
                </div>
                <div class="item-amount">${formatCurrency(overview.totalOwed)}</div>
            </div>
        `;
    });

    window.totalOutgoing = totalOutgoing; // Para usar en el balance final
    return html || '<div class="empty-state">No hay acreedores registrados</div>';
}

// Generar resumen de gastos fijos
function generateFixedExpensesSummary(selectedMonth) {
    let html = '';
    let totalFixed = 0;

    state.fixedExpenses.forEach(expense => {
        const isPaid = expense.isMonthPaid(selectedMonth);
        if (!isPaid) totalFixed += expense.amount;
        
        html += `
            <div class="summary-item ${isPaid ? 'paid' : 'pending'}">
                <div class="item-info">
                    <span class="item-name">${expense.name}</span>
                    <span class="payment-status ${isPaid ? 'status-paid' : 'status-pending'}">
                        ${isPaid ? 'PAGADO' : 'PENDIENTE'}
                    </span>
                </div>
                <div class="item-amount">${formatCurrency(expense.amount)}</div>
            </div>
        `;
    });

    window.totalFixed = totalFixed; // Para usar en el balance final
    return html || '<div class="empty-state">No hay gastos fijos registrados</div>';
}

// Generar sección de balance
function generateBalanceSection() {
    const totalIncoming = window.totalIncoming || 0;
    const totalOutgoing = window.totalOutgoing || 0;
    const totalFixed = window.totalFixed || 0;
    const finalBalance = totalIncoming - totalOutgoing - totalFixed;

    return `
        <div class="balance-section">
            <div class="balance-grid">
                <div class="balance-item incoming">
                    <div class="item-label">Total a Cobrar</div>
                    <div class="item-value">${formatCurrency(totalIncoming)}</div>
                </div>
                <div class="balance-item outgoing">
                    <div class="item-label">Total a Pagar</div>
                    <div class="item-value">${formatCurrency(totalOutgoing)}</div>
                </div>
                <div class="balance-item fixed">
                    <div class="item-label">Gastos Fijos Pendientes</div>
                    <div class="item-value">${formatCurrency(totalFixed)}</div>
                </div>
            </div>
            <div class="final-balance ${finalBalance >= 0 ? 'positive' : 'negative'}">
                <div class="balance-label">Balance Final</div>
                <div class="balance-amount">${formatCurrency(finalBalance)}</div>
            </div>
        </div>
    `;
}

// Actualizar UI
export function updateUI() {
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

    updateMonthlyOverview();
}


// Cambiar de pestaña
export function switchTab(tab) {
    state.currentTab = tab;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');
    
    ['debtors-section', 'creditors-section', 'fixed-expenses-section', 'overview-section'].forEach(section => {
        document.getElementById(section).style.display = 'none';
    });
    
    document.getElementById(`${tab}-section`).style.display = 'block';
    
    if (tab === 'overview') {
        updateMonthlyOverview();
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadState();
        switchTab('overview');
        
        const currentDate = new Date();
        const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        const overviewMonth = document.getElementById('overview-month');
        if (overviewMonth) {
            overviewMonth.value = currentMonth;
            updateMonthlyOverview();
        }
    } catch (error) {
        console.error('Error durante la inicialización:', error);
        clearAllData();
    }
});

// Manejadores de formularios
const formHandlers = {
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

Object.entries(formHandlers).forEach(([id, handler]) => {
    const form = document.getElementById(id);
    if (form) {
        form.addEventListener('submit', handler);
    }
});

// Exportar funciones globales
window.switchTab = switchTab;
window.updateMonthlyOverview = updateMonthlyOverview;