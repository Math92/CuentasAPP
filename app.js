// Clase para manejar los registros de deuda/crédito
class DebtRecord {
    constructor(name, amount, monthlyPayment, startDate, details) {
        this.id = Date.now();
        this.name = name;
        this.totalAmount = parseFloat(amount);
        this.monthlyPayment = parseFloat(monthlyPayment);
        this.startDate = startDate;
        this.details = details;
        this.payments = [];
        this.remainingAmount = this.totalAmount;
    }

    addPayment(amount, date, details = '') {
        this.payments.push({
            amount: parseFloat(amount),
            date: date,
            details: details
        });
        this.remainingAmount -= parseFloat(amount);
    }
}

// Clase para gastos fijos
class FixedExpense {
    constructor(name, amount, paymentDay, details) {
        this.id = Date.now();
        this.name = name;
        this.amount = parseFloat(amount);
        this.paymentDay = parseInt(paymentDay);
        this.details = details;
        this.history = [];
        this.payments = {}; // Objeto para almacenar pagos por mes: { "2025-01": { paid: true, date: "2025-01-15" } }
    }

    updateAmount(newAmount) {
        this.history.push({
            previousAmount: this.amount,
            newAmount: parseFloat(newAmount),
            dateChanged: new Date().toISOString()
        });
        this.amount = parseFloat(newAmount);
    }

    registerPayment(yearMonth, paymentDate, actualAmount = null) {
        this.payments[yearMonth] = {
            paid: true,
            date: paymentDate,
            amount: actualAmount || this.amount
        };
    }

    isMonthPaid(yearMonth) {
        return this.payments[yearMonth]?.paid || false;
    }

    getMonthPayment(yearMonth) {
        return this.payments[yearMonth];
    }
}

// Estado de la aplicación
const state = {
    debtors: [],
    creditors: [],
    fixedExpenses: [],
    currentTab: 'overview' // Cambiado para que la vista general sea la default
};

// Función para convertir objetos planos a instancias de clase
function convertToInstance(obj, type) {
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
                obj.totalAmount,
                obj.monthlyPayment,
                obj.startDate,
                obj.details
            );
            instance.id = obj.id;
            instance.payments = obj.payments || [];
            instance.remainingAmount = obj.remainingAmount;
            break;
    }
    
    return instance;
}

// Funciones auxiliares
function getNext12Months() {
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

function isMonthCurrentOrFuture(yearMonth) {
    const today = new Date();
    const [year, month] = yearMonth.split('-').map(Number);
    const checkDate = new Date(year, month - 1);
    const firstDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return checkDate >= firstDayOfCurrentMonth;
}

function isPaymentDueInMonth(record, monthDate) {
    const startDate = new Date(record.startDate);
    return startDate <= monthDate;
}

// Funciones de persistencia
function saveState() {
    try {
        localStorage.setItem('financeTrackerState', JSON.stringify(state));
    } catch (error) {
        console.error('Error saving state:', error);
    }
}

function loadState() {
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
    updateMonthlyOverview();
}

// Funciones de UI
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

function createPaymentForm(record, isDebtor) {
    const form = document.createElement('form');
    form.className = 'payment-form';
    form.innerHTML = `
        <div class="form-group">
            <label>Registrar Pago:</label>
            <input type="number" step="0.01" placeholder="Monto" required>
            <input type="date" required>
            <input type="text" placeholder="Detalles (opcional)">
            <button type="submit">Registrar</button>
        </div>
    `;
    
    form.onsubmit = (e) => {
        e.preventDefault();
        const amount = parseFloat(e.target.querySelector('input[type="number"]').value);
        const date = e.target.querySelector('input[type="date"]').value;
        const details = e.target.querySelector('input[type="text"]').value;
        
        record.addPayment(amount, date, details);
        saveState();
        updateUI();
        updateMonthlyOverview();
        e.target.reset();
    };
    
    return form;
}

function createRecordCard(record, isDebtor) {
    const card = document.createElement('div');
    card.className = 'record-card';
    
    const title = document.createElement('h3');
    title.textContent = record.name;
    
    const amount = document.createElement('p');
    amount.textContent = `Monto Total: $${record.totalAmount.toFixed(2)}`;
    
    const monthly = document.createElement('p');
    monthly.textContent = `Pago Mensual: $${record.monthlyPayment.toFixed(2)}`;
    
    const remaining = document.createElement('p');
    remaining.className = 'balance';
    remaining.textContent = `Saldo Pendiente: $${record.remainingAmount.toFixed(2)}`;
    
    const details = document.createElement('p');
    details.textContent = `Detalles: ${record.details || 'Sin detalles'}`;
    
    const paymentForm = createPaymentForm(record, isDebtor);
    
    const history = document.createElement('div');
    history.className = 'payment-history';
    history.innerHTML = '<h4>Historial de Pagos</h4>';
    
    record.payments.forEach(payment => {
        const paymentItem = document.createElement('div');
        paymentItem.className = 'payment-item';
        paymentItem.textContent = `${new Date(payment.date).toLocaleDateString()}: $${payment.amount.toFixed(2)} - ${payment.details || 'Sin detalles'}`;
        history.appendChild(paymentItem);
    });
    
    card.appendChild(title);
    card.appendChild(amount);
    card.appendChild(monthly);
    card.appendChild(remaining);
    card.appendChild(details);
    card.appendChild(paymentForm);
    card.appendChild(history);
    
    return card;
}

function createFixedExpenseCard(expense) {
    const card = document.createElement('div');
    card.className = 'record-card';
    
    const title = document.createElement('h3');
    title.textContent = expense.name;
    
    const amount = document.createElement('p');
    amount.textContent = `Monto Mensual: $${expense.amount.toFixed(2)}`;
    
    const paymentDay = document.createElement('p');
    paymentDay.textContent = `Día de pago: ${expense.paymentDay}`;
    
    const details = document.createElement('p');
    details.textContent = `Detalles: ${expense.details || 'Sin detalles'}`;

    // Sección de registro de pagos mensuales
    const paymentSection = document.createElement('div');
    paymentSection.className = 'monthly-payment-section';
    
    // Selector de mes para pagos
    const monthSelector = document.createElement('div');
    monthSelector.className = 'payment-month-selector';
    monthSelector.innerHTML = `
        <div class="form-group">
            <label>Registrar pago para el mes:</label>
            <input type="month" class="month-input">
            <input type="date" class="date-input" placeholder="Fecha de pago">
            <input type="number" class="amount-input" step="0.01" placeholder="Monto (opcional)">
            <button type="button" class="register-payment-btn">Registrar Pago</button>
        </div>
    `;

    const registerBtn = monthSelector.querySelector('.register-payment-btn');
    registerBtn.onclick = (e) => {
        const monthInput = monthSelector.querySelector('.month-input');
        const dateInput = monthSelector.querySelector('.date-input');
        const amountInput = monthSelector.querySelector('.amount-input');
        
        if (monthInput.value && dateInput.value) {
            expense.registerPayment(
                monthInput.value, 
                dateInput.value,
                amountInput.value ? parseFloat(amountInput.value) : null
            );
            saveState();
            updateUI();
            updateMonthlyOverview();
            monthInput.value = '';
            dateInput.value = '';
            amountInput.value = '';
        }
    };

    const paymentsHistory = document.createElement('div');
    paymentsHistory.className = 'payment-history';
    paymentsHistory.innerHTML = '<h4>Historial de Pagos</h4>';

    const months = getNext12Months();
    months.forEach(yearMonth => {
        const payment = expense.getMonthPayment(yearMonth);
        const monthDiv = document.createElement('div');
        monthDiv.className = `payment-item ${payment ? 'paid' : 'pending'}`;
        const [year, month] = yearMonth.split('-');
        const monthName = new Date(year, month - 1).toLocaleDateString('es', { month: 'long' });
        
        if (payment || isMonthCurrentOrFuture(yearMonth)) {
            monthDiv.innerHTML = payment ? `
                <span class="month-name">${monthName} ${year}</span>
                <span class="payment-status paid">PAGADO</span>
                <span class="payment-details">
                    Fecha: ${new Date(payment.date).toLocaleDateString()}
                    ${payment.amount ? `- Monto: $${payment.amount.toFixed(2)}` : ''}
                </span>
            ` : `
                <span class="month-name">${monthName} ${year}</span>
                <span class="payment-status pending">PENDIENTE</span>
            `;
            paymentsHistory.appendChild(monthDiv);
        }
    });

    const updateForm = document.createElement('form');
    updateForm.className = 'update-form';
    updateForm.innerHTML = `
        <div class="form-group">
            <label>Actualizar Monto:</label>
            <input type="number" step="0.01" required>
            <button type="submit">Actualizar</button>
        </div>
    `;
    
    updateForm.onsubmit = (e) => {
        e.preventDefault();
        const newAmount = e.target.querySelector('input').value;
        expense.updateAmount(newAmount);
        saveState();
        updateUI();
        updateMonthlyOverview();
        e.target.reset();
    };
    
    card.appendChild(title);
    card.appendChild(amount);
    card.appendChild(paymentDay);
    card.appendChild(details);
    card.appendChild(monthSelector);
    card.appendChild(paymentsHistory);
    card.appendChild(updateForm);
    
    return card;
}

function updateMonthlyOverview() {
    const selectedMonth = document.getElementById('overview-month')?.value;
    if (!selectedMonth) return;

    const [year, month] = selectedMonth.split('-');
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const incomingPaymentsDiv = document.getElementById('incoming-payments');
    const outgoingPaymentsDiv = document.getElementById('outgoing-payments');
    const fixedExpensesDiv = document.getElementById('fixed-expenses-summary');
    const monthlyBalanceDiv = document.getElementById('monthly-balance');

    if (!incomingPaymentsDiv || !outgoingPaymentsDiv || !fixedExpensesDiv || !monthlyBalanceDiv) return;

    incomingPaymentsDiv.innerHTML = '';
    outgoingPaymentsDiv.innerHTML = '';
    fixedExpensesDiv.innerHTML = '';

    let totalIncoming = 0;
    let totalOutgoing = 0;
    let totalFixed = 0;

    // Procesar deudores (pagos a recibir)
    state.debtors.forEach(debtor => {
        const isActive = new Date(debtor.startDate) <= endDate && 
                        debtor.remainingAmount > 0;

        if (isActive) {
            const paymentDiv = document.createElement('div');
            paymentDiv.className = 'payment-item';
            paymentDiv.textContent = `${debtor.name}: $${debtor.monthlyPayment.toFixed(2)}`;
            incomingPaymentsDiv.appendChild(paymentDiv);
            totalIncoming += debtor.monthlyPayment;
        }
    });

    // Procesar acreedores (pagos a realizar)
    state.creditors.forEach(creditor => {
        const isActive = new Date(creditor.startDate) <= endDate && 
                        creditor.remainingAmount > 0;

        if (isActive) {
            const paymentDiv = document.createElement('div');
            paymentDiv.className = 'payment-item';
            paymentDiv.textContent = `${creditor.name}: $${creditor.monthlyPayment.toFixed(2)}`;
            outgoingPaymentsDiv.appendChild(paymentDiv);
            totalOutgoing += creditor.monthlyPayment;
        }
    });

    // Procesar gastos fijos
    state.fixedExpenses.forEach(expense => {
        const yearMonthStr = `${year}-${month.padStart(2, '0')}`;
        const payment = expense.getMonthPayment(yearMonthStr);
        const status = payment ? 'PAGADO' : 'PENDIENTE';
        
        const expenseDiv = document.createElement('div');
        expenseDiv.className = `payment-item ${payment ? 'paid' : 'pending'}`;
        expenseDiv.innerHTML = `
            <span>${expense.name}: $${expense.amount.toFixed(2)} (Día ${expense.paymentDay})</span>
            <span class="payment-status ${payment ? 'paid' : 'pending'}">${status}</span>
        `;
        
        fixedExpensesDiv.appendChild(expenseDiv);
        if (!payment) {
            totalFixed += expense.amount;
        }
    });

    // Calcular y mostrar balance mensual
    const totalBalance = totalIncoming - totalOutgoing - totalFixed;
    monthlyBalanceDiv.innerHTML = `
        <div class="balance-details">
            <p>Total a Recibir: $${totalIncoming.toFixed(2)}</p>
            <p>Total a Pagar: $${totalOutgoing.toFixed(2)}</p>
            <p>Total Gastos Fijos Pendientes: $${totalFixed.toFixed(2)}</p>
            <p class="total-balance ${totalBalance >= 0 ? 'positive' : 'negative'}">
                Balance Final Estimado: $${totalBalance.toFixed(2)}
            </p>
        </div>
    `;
}

function updateUI() {
    // Actualizar listas existentes
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

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    
    // Inicializar la UI
    try {
        // Cambiar a vista general por defecto
        switchTab('overview');
        
        // Establecer el mes actual en el selector de mes
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
            document.getElementById('debt-amount').value,
            document.getElementById('monthly-payment').value,
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
            document.getElementById('credit-amount').value,
            document.getElementById('monthly-payment-creditor').value,
            document.getElementById('start-date-creditor').value,
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