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
            
            <div class="month-selector">
                <label for="overview-month">Seleccionar Mes:</label>
                <input type="month" id="overview-month" value="${selectedMonth}" required>
                <button onclick="updateMonthlyOverview()" class="update-btn">Actualizar Vista</button>
            </div>

            <div class="summary-section debtors-section">
                <div class="section-header">
                    <h2>Deudores - Cuotas y Pagos a Recibir</h2>
                </div>
                <div class="section-content" id="debtors-summary">
                    ${generateDebtorsSummary(selectedMonth)}
                </div>
            </div>

            <div class="summary-section creditors-section">
                <div class="section-header">
                    <h2>Acreedores - Cuotas y Pagos a Realizar</h2>
                </div>
                <div class="section-content" id="creditors-summary">
                    ${generateCreditorsSummary(selectedMonth)}
                </div>
            </div>

            <div class="summary-section fixed-expenses-section">
                <div class="section-header">
                    <h2>Gastos Fijos del Mes</h2>
                </div>
                <div class="section-content" id="fixed-expenses-summary">
                    ${generateFixedExpensesSummary(selectedMonth)}
                </div>
            </div>

            ${generateBalanceSection(selectedMonth)}
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
    let totalInstallments = 0;

    state.debtors.forEach(debtor => {
        const overview = debtor.getMonthlyOverview(selectedMonth);
        const installmentsDue = overview.installmentsDue || 0;
        totalIncoming += overview.totalOwed;
        totalInstallments += installmentsDue;
        
        html += `
            <div class="summary-item">
                <div class="item-info">
                    <span class="item-name">${debtor.name}</span>
                    <div class="item-details">
                        <span class="loan-count">Préstamos activos: ${overview.activeLoansCount}</span>
                        ${installmentsDue > 0 ? 
                            `<span class="installment-info">Cuota mensual: ${formatCurrency(installmentsDue)}</span>` : 
                            ''}
                    </div>
                </div>
                <div class="item-amounts">
                    <div class="total-amount">${formatCurrency(overview.totalOwed)}</div>
                    ${installmentsDue > 0 ? 
                        `<div class="monthly-amount">Este mes: ${formatCurrency(installmentsDue)}</div>` : 
                        ''}
                </div>
            </div>
        `;
    });

    window.totalIncoming = totalIncoming;
    window.totalInstallmentsIncoming = totalInstallments;
    return html || '<div class="empty-state">No hay deudores registrados</div>';
}

// Generar resumen de acreedores
function generateCreditorsSummary(selectedMonth) {
    let html = '';
    let totalOutgoing = 0;
    let totalInstallments = 0;

    state.creditors.forEach(creditor => {
        const overview = creditor.getMonthlyOverview(selectedMonth);
        const installmentsDue = overview.installmentsDue;
        totalOutgoing += overview.totalOwed;
        totalInstallments += installmentsDue;
        
        html += `
            <div class="summary-item">
                <div class="item-info">
                    <span class="item-name">${creditor.name}</span>
                    <div class="item-details">
                        <span class="loan-count">Créditos activos: ${overview.activeLoansCount}</span>
                        ${installmentsDue > 0 ? 
                            `<span class="installment-info">Cuota mensual: ${formatCurrency(installmentsDue)}</span>` 
                            : ''}
                    </div>
                </div>
                <div class="item-amounts">
                    <div class="total-amount">${formatCurrency(overview.totalOwed)}</div>
                    ${installmentsDue > 0 ? 
                        `<div class="monthly-amount">Este mes: ${formatCurrency(installmentsDue)}</div>` 
                        : ''}
                </div>
            </div>
        `;
    });

    window.totalOutgoing = totalOutgoing;
    window.totalInstallmentsOutgoing = totalInstallments;
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
function generateBalanceSection(selectedMonth) {
    const totalIncoming = window.totalIncoming || 0;
    const totalOutgoing = window.totalOutgoing || 0;
    const totalFixed = window.totalFixed || 0;
    const monthlyInstallmentsIncoming = window.totalInstallmentsIncoming || 0;
    const monthlyInstallmentsOutgoing = window.totalInstallmentsOutgoing || 0;
    const finalBalance = totalIncoming - totalOutgoing - totalFixed;
    const monthlyBalance = monthlyInstallmentsIncoming - monthlyInstallmentsOutgoing - totalFixed;

    return `
        <div class="balance-section">
            <div class="balance-grid">
                <div class="balance-item incoming">
                    <div class="item-label">Total a Cobrar</div>
                    <div class="item-value">${formatCurrency(totalIncoming)}</div>
                    <div class="item-monthly">Este mes: ${formatCurrency(monthlyInstallmentsIncoming)}</div>
                </div>
                <div class="balance-item outgoing">
                    <div class="item-label">Total a Pagar</div>
                    <div class="item-value">${formatCurrency(totalOutgoing)}</div>
                    <div class="item-monthly">Este mes: ${formatCurrency(monthlyInstallmentsOutgoing)}</div>
                </div>
                <div class="balance-item fixed">
                    <div class="item-label">Gastos Fijos Pendientes</div>
                    <div class="item-value">${formatCurrency(totalFixed)}</div>
                </div>
            </div>
            <div class="final-balance">
                <div class="balance-total ${finalBalance >= 0 ? 'positive' : 'negative'}">
                    <div class="balance-label">Balance Total</div>
                    <div class="balance-amount">${formatCurrency(finalBalance)}</div>
                </div>
                <div class="balance-monthly ${monthlyBalance >= 0 ? 'positive' : 'negative'}">
                    <div class="balance-label">Balance Mensual</div>
                    <div class="balance-amount">${formatCurrency(monthlyBalance)}</div>
                </div>
            </div>
        </div>
    `;
}


// Modificar en events.js
export function updateUI() {
    const currentTab = state.currentTab;

    // Solo mostrar las listas en sus secciones específicas
    if (currentTab === 'debtors') {
        const debtorsList = document.getElementById('debtors-list');
        if (debtorsList) {
            debtorsList.innerHTML = '';
            state.debtors.forEach(debtor => {
                debtorsList.appendChild(createRecordCard(debtor, true));
            });
        }
    }
    
    if (currentTab === 'creditors') {
        const creditorsList = document.getElementById('creditors-list');
        if (creditorsList) {
            creditorsList.innerHTML = '';
            state.creditors.forEach(creditor => {
                creditorsList.appendChild(createRecordCard(creditor, false));
            });
        }
    }

    if (currentTab === 'fixed-expenses') {
        const expensesList = document.getElementById('fixed-expenses-list');
        if (expensesList) {
            expensesList.innerHTML = '';
            state.fixedExpenses.forEach(expense => {
                expensesList.appendChild(createFixedExpenseCard(expense));
            });
        }
    }

    if (currentTab === 'overview') {
        updateMonthlyOverview();
    }
}


// Cambiar de pestaña
export function switchTab(tab) {
    state.currentTab = tab;
    
    // Ocultar todas las secciones
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });

    // Quitar clase activa de todas las pestañas
    document.querySelectorAll('.tab').forEach(t => {
        t.classList.remove('active');
    });

    // Activar pestaña y sección correspondiente
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    const section = document.getElementById(`${tab}-section`);
    if (section) {
        section.style.display = 'block';
        
        // Actualizar listas según la sección
        if (tab === 'debtors') {
            const debtorsList = document.getElementById('debtors-list');
            if (debtorsList) {
                debtorsList.innerHTML = '';
                state.debtors.forEach(debtor => {
                    debtorsList.appendChild(createRecordCard(debtor, true));
                });
            }
        } else if (tab === 'creditors') {
            const creditorsList = document.getElementById('creditors-list');
            if (creditorsList) {
                creditorsList.innerHTML = '';
                state.creditors.forEach(creditor => {
                    creditorsList.appendChild(createRecordCard(creditor, false));
                });
            }
        } else if (tab === 'fixed-expenses') {
            const expensesList = document.getElementById('fixed-expenses-list');
            if (expensesList) {
                expensesList.innerHTML = '';
                state.fixedExpenses.forEach(expense => {
                    expensesList.appendChild(createFixedExpenseCard(expense));
                });
            }
        } else if (tab === 'overview') {
            updateMonthlyOverview();
        }
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    // Manejar visibilidad de campos de cuotas en formularios
    const installmentToggles = [
        { checkbox: 'installments-enabled', group: 'installments-group' },
        { checkbox: 'creditor-installments-enabled', group: 'creditor-installments-group' }
    ];

    installmentToggles.forEach(({checkbox, group}) => {
        const checkboxEl = document.getElementById(checkbox);
        const groupEl = document.getElementById(group);
        if (checkboxEl && groupEl) {
            checkboxEl.addEventListener('change', (e) => {
                groupEl.classList.toggle('hidden', !e.target.checked);
            });
        }
    });

    document.getElementById('installments-enabled')?.addEventListener('change', function(e) {
        const installmentsInput = document.getElementById('installments-input');
        if (installmentsInput) {
            installmentsInput.classList.toggle('hidden', !e.target.checked);
            
            if (!e.target.checked) {
                document.getElementById('installments-count').value = '';
            }
        }
    });

    document.getElementById('installments-count')?.addEventListener('input', function() {
        const totalAmount = parseFloat(document.getElementById('debt-amount').value) || 0;
        const numberOfInstallments = parseInt(this.value) || 1;
        const monthlyAmount = totalAmount / numberOfInstallments;
        
        // Look for the monthly amount span within the same installments section
        const monthlyAmountElement = this.closest('.installments-section')?.querySelector('.monthly-amount');
        if (monthlyAmountElement) {
            monthlyAmountElement.textContent = `Cuota mensual: ${formatCurrency(monthlyAmount)}`;
        }
    });

    // Agregar el mismo manejo para acreedores
    document.getElementById('creditor-installments-enabled')?.addEventListener('change', function(e) {
        const installmentsInput = document.getElementById('creditor-installments-input');
        if (installmentsInput) {
            installmentsInput.classList.toggle('hidden', !e.target.checked);
            
            if (!e.target.checked) {
                document.getElementById('creditor-installments-count').value = '';
            }
        }
    });

    document.getElementById('creditor-installments-count')?.addEventListener('input', function() {
        const totalAmount = parseFloat(document.getElementById('credit-amount').value) || 0;
        const numberOfInstallments = parseInt(this.value) || 1;
        const monthlyAmount = totalAmount / numberOfInstallments;
        
        // Look for the monthly amount span within the same installments section
        const monthlyAmountElement = this.closest('.installments-section')?.querySelector('.monthly-amount');
        if (monthlyAmountElement) {
            monthlyAmountElement.textContent = `Cuota mensual: ${formatCurrency(monthlyAmount)}`;
        }
    });
});

// Manejadores de formularios
const formHandlers = {
    'fixed-expense-form': async (e) => {  // Agregado async
        e.preventDefault();
        try {
            const expense = new FixedExpense(
                document.getElementById('expense-name').value,
                document.getElementById('expense-amount').value,
                document.getElementById('expense-day').value,
                document.getElementById('expense-details').value
            );
            state.fixedExpenses.push(expense);
            await saveState();  // Agregado await
            updateUI();
            e.target.reset();
            switchTab('overview');
        } catch (error) {
            alert('Error al guardar el gasto fijo: ' + error.message);
        }
    },
    'debtor-form': async (e) => {  // Agregado async
        e.preventDefault();
        try {
            const debtor = new DebtRecord(
                document.getElementById('debtor-name').value,
                document.getElementById('debtor-details').value
            );
            
            const amount = parseFloat(document.getElementById('debt-amount').value);
            const date = document.getElementById('start-date').value;
            const details = document.getElementById('debtor-details').value;
            
            const isInstallments = document.getElementById('installments-enabled')?.checked;
            const installments = isInstallments ? 
                parseInt(document.getElementById('installments-count').value) : null;

            if (isInstallments && (!installments || installments <= 0)) {
                throw new Error('El número de cuotas debe ser mayor a 0');
            }
            
            if (!amount || amount <= 0) {
                throw new Error('El monto debe ser mayor a 0');
            }

            debtor.addLoan(amount, date, details, installments);
            state.debtors.push(debtor);
            await saveState();
            updateUI();
            e.target.reset();
            switchTab('overview');
        } catch (error) {
            alert(error.message);
        }
    },
    'creditor-form': async (e) => {  // Agregado async
        e.preventDefault();
        try {
            const creditor = new DebtRecord(
                document.getElementById('creditor-name').value,
                document.getElementById('creditor-details').value
            );
            
            const amount = parseFloat(document.getElementById('credit-amount').value);
            const date = document.getElementById('credit-date').value;
            const details = document.getElementById('creditor-details').value;
            
            const isInstallments = document.getElementById('creditor-installments-enabled')?.checked;
            const installments = isInstallments ? 
                parseInt(document.getElementById('creditor-installments-count').value) : null;

            if (isInstallments && (!installments || installments <= 0)) {
                throw new Error('El número de cuotas debe ser mayor a 0');
            }
            
            if (!amount || amount <= 0) {
                throw new Error('El monto debe ser mayor a 0');
            }

            creditor.addLoan(amount, date, details, installments);
            state.creditors.push(creditor);
            await saveState();
            updateUI();
            e.target.reset();
            switchTab('overview');
        } catch (error) {
            alert(error.message);
        }
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