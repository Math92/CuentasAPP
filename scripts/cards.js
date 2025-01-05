import { state, saveState, getNext12Months, isMonthCurrentOrFuture } from './states.js';
import { updateUI } from './events.js';
import { firebaseService } from './firebase-service.js';

// Función auxiliar para formatear moneda
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS'
    }).format(amount);
};

// Función para registrar pagos
async function registerPayment(recordId, loanId, amount, date, details) {
    try {
        const record = [...state.debtors, ...state.creditors]
            .find(r => r.id === recordId);
        
        if (!record) {
            throw new Error('Registro no encontrado');
        }

        await record.addPaymentToLoan(loanId, amount, date, details);
        await saveState();
        await updateUI();
    } catch (error) {
        throw error;
    }
}

// Función para crear una tarjeta de registro de deuda/crédito
export function createRecordCard(record, isDebtor) {
    const card = document.createElement('div');
    card.className = 'record-card';
    card.dataset.recordId = record.id;
    
    const header = document.createElement('div');
    header.className = 'card-header';
    
    const title = document.createElement('h3');
    title.textContent = record.name;
    
    const deleteButton = createDeleteButton(record, isDebtor ? 'deudor' : 'acreedor');
    
    header.appendChild(title);
    header.appendChild(deleteButton);
    card.appendChild(header);

    // Mostrar total adeudado
    const totalAmount = document.createElement('p');
    totalAmount.className = 'total-amount';
    totalAmount.textContent = `Total Pendiente: ${formatCurrency(record.totalOwed)}`;
    card.appendChild(totalAmount);
    
    // Contenedor para préstamos
    const loansContainer = document.createElement('div');
    loansContainer.className = 'loans-container';
    
    // Mostrar préstamos activos
    record.getActiveLoans().forEach(loan => {
        const loanItem = createLoanItem(loan, record.id);
        loansContainer.appendChild(loanItem);
    });

    // Mostrar préstamos completados
    const completedLoans = record.getCompletedLoans();
    if (completedLoans.length > 0) {
        const completedSection = document.createElement('div');
        completedSection.className = 'completed-loans-section';
        completedSection.innerHTML = '<h4>Préstamos Completados</h4>';
        
        completedLoans.forEach(loan => {
            const loanItem = createLoanItem(loan, record.id);
            completedSection.appendChild(loanItem);
        });
        
        loansContainer.appendChild(completedSection);
    }

    card.appendChild(loansContainer);


// Formulario para nuevo préstamo
const newLoanSection = document.createElement('div');
newLoanSection.className = 'new-loan-section hidden';
newLoanSection.innerHTML = `
    <form class="add-loan-form">
        <h4>Agregar Nuevo Préstamo</h4>
        <div class="form-group">
            <label>Monto del Préstamo:</label>
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
            <button type="submit" class="submit-btn">Guardar Préstamo</button>
            <button type="button" class="cancel-btn">Cancelar</button>
        </div>
    </form>
`;
card.appendChild(newLoanSection);

// Botón para mostrar formulario
const addLoanButton = document.createElement('button');
addLoanButton.className = 'add-loan-button';
addLoanButton.textContent = `Agregar Nuevo ${isDebtor ? 'Préstamo' : 'Crédito'}`;
addLoanButton.onclick = () => {
    newLoanSection.classList.remove('hidden');
    addLoanButton.classList.add('hidden');
};
card.appendChild(addLoanButton);

// Manejar el formulario de nuevo préstamo
const addLoanForm = newLoanSection.querySelector('.add-loan-form');
const cancelButton = newLoanSection.querySelector('.cancel-btn');

addLoanForm.onsubmit = async (e) => {
    e.preventDefault();
    try {
        const amount = e.target.querySelector('.amount-input').value;
        const date = e.target.querySelector('.date-input').value;
        const description = e.target.querySelector('.description-input').value;
        
        if (record) {
            record.addLoan(amount, date, description);
            await saveState();
            updateUI();
        }
        
        newLoanSection.classList.add('hidden');
        addLoanButton.classList.remove('hidden');
        e.target.reset();
    } catch (error) {
        alert('Error al crear el préstamo: ' + error.message);
    }
};

cancelButton.onclick = () => {
    newLoanSection.classList.add('hidden');
    addLoanButton.classList.remove('hidden');
    addLoanForm.reset();
};

return card;
}

// Función para crear un ítem de préstamo
export function createLoanItem(loan, recordId) {
const loanItem = document.createElement('div');
loanItem.className = `loan-item ${loan.status}`;
loanItem.dataset.loanId = loan.id;

// Header del préstamo
const header = document.createElement('div');
header.className = 'loan-header';
header.innerHTML = `
    <h4 class="loan-title">${loan.description || 'Sin descripción'}</h4>
    <div class="loan-metadata">
        <span class="loan-date">Fecha: ${new Date(loan.startDate).toLocaleDateString()}</span>
        <span class="loan-status ${loan.status}">${loan.status === 'active' ? 'Activo' : 'Completado'}</span>
    </div>
`;

// Detalles del préstamo
const details = document.createElement('div');
details.className = 'loan-details';
details.innerHTML = `
    <div class="loan-amounts">
        <div class="amount-box">
            <span class="amount-label">Monto Original:</span>
            <span class="amount-value">${formatCurrency(loan.amount)}</span>
        </div>
        <div class="amount-box">
            <span class="amount-label">Saldo Pendiente:</span>
            <span class="amount-value ${loan.status === 'completed' ? 'completed' : ''}">${formatCurrency(loan.remainingAmount)}</span>
        </div>
        <div class="amount-box">
            <span class="amount-label">Total Pagado:</span>
            <span class="amount-value">${formatCurrency(loan.getTotalPaid())}</span>
        </div>
    </div>
`;

// Formulario de pago (solo para préstamos activos)
if (loan.status === 'active') {
    const paymentForm = document.createElement('form');
    paymentForm.className = 'payment-form';
    paymentForm.innerHTML = `
        <h5>Registrar Pago</h5>
        <div class="payment-inputs">
            <div class="form-group">
                <label>Monto (Máx: ${formatCurrency(loan.remainingAmount)})</label>
                <input type="number" step="0.01" max="${loan.remainingAmount}" required>
            </div>
            <div class="form-group">
                <label>Fecha</label>
                <input type="date" required value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
                <label>Detalles del pago</label>
                <input type="text" placeholder="Detalles opcionales">
            </div>
            <button type="submit">Registrar Pago</button>
        </div>
    `;
    
    paymentForm.onsubmit = async (e) => {
        e.preventDefault();
        try {
            const [amountInput, dateInput, detailsInput] = e.target.querySelectorAll('input');
            const amount = parseFloat(amountInput.value);
            
            if (amount <= 0) {
                throw new Error('El monto debe ser mayor a 0');
            }
            if (amount > loan.remainingAmount) {
                throw new Error(`El pago excede el monto restante. Máximo a pagar: ${formatCurrency(loan.remainingAmount)}`);
            }

            await registerPayment(recordId, loan.id, amount, dateInput.value, detailsInput.value);
            e.target.reset();
        } catch (error) {
            alert(error.message);
        }
    };
    
    loanItem.appendChild(paymentForm);
}

// Historial de pagos
const history = document.createElement('div');
history.className = 'payment-history';
history.innerHTML = '<h5>Historial de Pagos</h5>';

if (loan.payments && loan.payments.length > 0) {
    const paymentsList = document.createElement('div');
    paymentsList.className = 'payments-list';
    
    loan.payments
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .forEach(payment => {
            const paymentItem = document.createElement('div');
            paymentItem.className = 'payment-item';
            paymentItem.innerHTML = `
                <span class="payment-date">${new Date(payment.date).toLocaleDateString()}</span>
                <span class="payment-details">${payment.details || 'Sin detalles'}</span>
                <span class="payment-amount">${formatCurrency(payment.amount)}</span>
            `;
            paymentsList.appendChild(paymentItem);
        });
    
    history.appendChild(paymentsList);
} else {
    history.innerHTML += '<p class="no-payments">No hay pagos registrados</p>';
}

loanItem.appendChild(header);
loanItem.appendChild(details);
loanItem.appendChild(history);

return loanItem;
}

export function createFixedExpenseCard(expense) {
    const card = document.createElement('div');
    card.className = 'record-card';
    
    const header = document.createElement('div');
    header.className = 'card-header';
    
    const title = document.createElement('h3');
    title.textContent = expense.name;
    
    const deleteButton = createDeleteButton(expense, 'gasto fijo');
    
    header.appendChild(title);
    header.appendChild(deleteButton);
    card.appendChild(header);
    
    // Sección de registro de pagos
    const paymentSection = document.createElement('div');
    paymentSection.className = 'payment-section';
    paymentSection.innerHTML = `
        <div class="form-group">
            <label>Registrar pago para el mes:</label>
            <input type="month" class="month-input">
            <input type="date" class="date-input">
            <input type="number" class="amount-input" step="0.01" placeholder="Monto (opcional)">
            <button type="button" class="register-payment-btn">Registrar Pago</button>
        </div>
    `;
    
    // Evento para registrar pago
    const registerBtn = paymentSection.querySelector('.register-payment-btn');
    registerBtn.onclick = () => {
        const monthInput = paymentSection.querySelector('.month-input');
        const dateInput = paymentSection.querySelector('.date-input');
        const amountInput = paymentSection.querySelector('.amount-input');
        
        if (monthInput.value && dateInput.value) {
            expense.registerPayment(
                monthInput.value,
                dateInput.value,
                amountInput.value ? parseFloat(amountInput.value) : null
            );
            saveState();
            updateUI();
        }
    };
    
    // Historial de pagos
    const historySection = createExpenseHistory(expense);
    
    card.appendChild(header);
    card.appendChild(paymentSection);
    card.appendChild(historySection);
    
    return card;
}

function createExpenseHistory(expense) {
    const historySection = document.createElement('div');
    historySection.className = 'payment-history';
    historySection.innerHTML = '<h4>Historial de Pagos</h4>';
    
    const months = getNext12Months();
    months.forEach(yearMonth => {
        const payment = expense.getMonthPayment(yearMonth);
        if (payment || isMonthCurrentOrFuture(yearMonth)) {
            const monthDiv = document.createElement('div');
            monthDiv.className = `payment-item ${payment ? 'paid' : 'pending'}`;
            
            const [year, month] = yearMonth.split('-');
            const monthName = new Date(year, month - 1).toLocaleDateString('es', { month: 'long' });
            
            monthDiv.innerHTML = payment ? `
                <span class="month-name">${monthName} ${year}</span>
                <span class="payment-status paid">PAGADO</span>
                <span class="payment-details">
                    Fecha: ${new Date(payment.date).toLocaleDateString()}
                    ${payment.amount ? `- Monto: ${formatCurrency(payment.amount)}` : ''}
                </span>
            ` : `
                <span class="month-name">${monthName} ${year}</span>
                <span class="payment-status pending">PENDIENTE</span>
            `;
            
            historySection.appendChild(monthDiv);
        }
    });
    
    return historySection;
}

function createDeleteButton(record, type) {
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-btn';
    deleteButton.innerHTML = '🗑️ Eliminar';
    deleteButton.onclick = async () => {
        if (confirm(`¿Estás seguro de eliminar este registro de ${type}?`)) {
            try {
                switch (type) {
                    case 'deudor':
                        await firebaseService.deleteDebtor(record.id);
                        state.debtors = state.debtors.filter(d => d.id !== record.id);
                        break;
                    case 'acreedor':
                        await firebaseService.deleteCreditor(record.id);
                        state.creditors = state.creditors.filter(c => c.id !== record.id);
                        break;
                    case 'gasto fijo':
                        await firebaseService.deleteFixedExpense(record.id);
                        state.fixedExpenses = state.fixedExpenses.filter(e => e.id !== record.id);
                        break;
                }
                updateUI();
            } catch (error) {
                console.error('Error al eliminar:', error);
                alert('Error al eliminar el registro');
            }
        }
    };
    return deleteButton;
}