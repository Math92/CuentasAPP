// cards.js - Parte 1
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

// Función unificada para registrar pagos
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

// Formulario unificado de pagos
function createPaymentForm(loan, recordId) {
    const paymentForm = document.createElement('form');
    paymentForm.className = 'payment-form';
    
    // Determinar el monto según el tipo de préstamo
    const maxAmount = loan.type === 'auto' ? parseFloat(loan.monthlyAmount) : loan.remainingAmount;
    const defaultAmount = loan.type === 'auto' ? parseFloat(loan.monthlyAmount) : '';
    
    paymentForm.innerHTML = `
        <h5>Registrar Pago</h5>
        <div class="payment-inputs">
            <div class="form-group">
                <label>
                    Monto ${loan.type === 'auto' 
                        ? `(Cuota fija: ${formatCurrency(parseFloat(loan.monthlyAmount))})` 
                        : `(Máx: ${formatCurrency(loan.remainingAmount)})`}
                </label>
                <input type="number" 
                    step="0.01" 
                    max="${maxAmount}" 
                    value="${defaultAmount}"
                    ${loan.type === 'auto' ? 'readonly' : ''}
                    required>
            </div>
            <div class="form-group">
                <label>Fecha</label>
                <input type="date" required value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
                <label>Detalles del pago</label>
                <input type="text" placeholder="Detalles opcionales">
            </div>
            <button type="submit" class="submit-btn">Registrar Pago</button>
        </div>
    `;
    
    paymentForm.onsubmit = async (e) => {
        e.preventDefault();
        try {
            const [amountInput, dateInput, detailsInput] = e.target.querySelectorAll('input');
            const amount = parseFloat(amountInput.value);
            
            // Validaciones por tipo de préstamo
            if (loan.type === 'auto') {
                if (amount !== parseFloat(loan.monthlyAmount)) {
                    throw new Error(`El pago debe ser igual al monto de la cuota: ${formatCurrency(parseFloat(loan.monthlyAmount))}`);
                }
            } else {
                if (amount <= 0) {
                    throw new Error('El monto debe ser mayor a 0');
                }
                if (amount > loan.remainingAmount) {
                    throw new Error(`El pago excede el monto restante. Máximo a pagar: ${formatCurrency(loan.remainingAmount)}`);
                }
            }

            await registerPayment(recordId, loan.id, amount, dateInput.value, detailsInput.value);
            e.target.reset();
            if (loan.type === 'auto') {
                amountInput.value = loan.monthlyAmount;
            }
        } catch (error) {
            alert(error.message);
        }
    };
    
    return paymentForm;
}

// Función para crear formulario de nuevo préstamo
function createAddLoanForm(recordId, isDebtor) {
    const formContainer = document.createElement('div');
    formContainer.className = 'add-loan-form hidden';
    
    formContainer.innerHTML = `
        <div class="form-overlay">
            <div class="loan-form-container">
                <h3>Agregar Nuevo ${isDebtor ? 'Préstamo' : 'Crédito'}</h3>
                <form>
                    <div class="form-group">
                        <label>Monto:</label>
                        <input type="number" class="amount-input" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label>Fecha:</label>
                        <input type="date" class="date-input" 
                            value="${new Date().toISOString().split('T')[0]}" required>
                    </div>
                    <div class="form-group">
                        <label>Descripción/Razón:</label>
                        <textarea class="description-input" rows="3"></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="save-btn">Guardar</button>
                        <button type="button" class="cancel-btn">Cancelar</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    const form = formContainer.querySelector('form');
    const cancelBtn = formContainer.querySelector('.cancel-btn');

    form.onsubmit = async (e) => {
        e.preventDefault();
        try {
            const amount = e.target.querySelector('.amount-input').value;
            const date = e.target.querySelector('.date-input').value;
            const description = e.target.querySelector('.description-input').value;

            const record = [...state.debtors, ...state.creditors]
                .find(r => r.id === recordId);

            if (record) {
                await record.addLoan(amount, date, description);
                await saveState();
                formContainer.classList.add('hidden');
                await updateUI();
            }
        } catch (error) {
            alert('Error al crear el préstamo: ' + error.message);
        }
    };

    cancelBtn.onclick = () => formContainer.classList.add('hidden');

    return formContainer;
}

// Función para crear item de préstamo
function createLoanItem(loan, recordId, isActive) {
    const loanItem = document.createElement('div');
    loanItem.className = `loan-item ${isActive ? 'active' : 'completed'}`;
    
    const headerClass = isActive ? 'loan-header active' : 'loan-header completed';
    
    loanItem.innerHTML = `
        <div class="${headerClass}">
            <div class="loan-title">
                <h4>${loan.description || 'Sin descripción'}</h4>
                <span class="loan-date">Fecha: ${new Date(loan.startDate).toLocaleDateString()}</span>
            </div>
            <span class="status-badge ${isActive ? 'active' : 'completed'}">
                ${isActive ? 'ACTIVO' : 'COMPLETADO'}
            </span>
        </div>
        
        <div class="loan-amounts">
            <div class="amount-box">
                <span class="label">Monto Original</span>
                <span class="value">${formatCurrency(loan.amount)}</span>
            </div>
            ${isActive ? `
                <div class="amount-box">
                    <span class="label">Saldo Pendiente</span>
                    <span class="value">${formatCurrency(loan.remainingAmount)}</span>
                </div>
            ` : ''}
            <div class="amount-box">
                <span class="label">Total Pagado</span>
                <span class="value">${formatCurrency(loan.getTotalPaid())}</span>
            </div>
        </div>
    `;

    // Solo agregar formulario de pago si el préstamo está activo
    if (isActive) {
        loanItem.appendChild(createPaymentForm(loan, recordId));
    }

    return loanItem;
}

// Función principal para crear tarjeta de registro
// Función createRecordCard actualizada
function createRecordCard(record, isDebtor) {
    // Contenedor principal
    const card = document.createElement('div');
    card.className = `record-card ${isDebtor ? 'debtor-item' : 'creditor-item'}`;
    card.dataset.recordId = record.id;
    
    // Header con nombre y botón de eliminar
    const header = document.createElement('div');
    header.className = 'record-header';
    header.innerHTML = `
        <h3>${record.name}</h3>
        <button class="delete-btn" data-record-id="${record.id}" data-type="${isDebtor ? 'deudor' : 'acreedor'}">
            🗑️ Eliminar
        </button>
    `;

    // Total pendiente
    const totalAmount = document.createElement('div');
    totalAmount.className = 'total-pending';
    totalAmount.textContent = `Total Pendiente: ${formatCurrency(record.totalOwed)}`;

    // Contenedor principal de préstamos
    const loansContainer = document.createElement('div');
    loansContainer.className = 'loans-container';

    // Sección de préstamos activos
    const activeLoans = record.getActiveLoans();
    if (activeLoans.length > 0) {
        const activeLoansList = document.createElement('div');
        activeLoansList.className = 'loans-list active-loans';
        activeLoansList.innerHTML = '<h4>Préstamos Activos</h4>';

        activeLoans
            .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
            .forEach(loan => {
                activeLoansList.appendChild(createLoanItem(loan, record.id, true));
            });

        loansContainer.appendChild(activeLoansList);
    }

    // Sección de préstamos completados
    const completedLoans = record.getCompletedLoans();
    if (completedLoans.length > 0) {
        const completedLoansList = document.createElement('div');
        completedLoansList.className = 'completed-loans-section';
        completedLoansList.innerHTML = '<h4>Préstamos Completados</h4>';

        completedLoans
            .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
            .forEach(loan => {
                completedLoansList.appendChild(createLoanItem(loan, record.id, false));
            });

        loansContainer.appendChild(completedLoansList);
    }

    // Agregar todo al card
    card.appendChild(header);
    card.appendChild(totalAmount);
    card.appendChild(loansContainer);

    // Botón y formulario para agregar nuevo préstamo
    const addLoanForm = createAddLoanForm(record.id, isDebtor);
    const addButton = document.createElement('button');
    addButton.className = 'add-loan-button';
    addButton.textContent = `Agregar Nuevo ${isDebtor ? 'Préstamo' : 'Crédito'}`;
    addButton.onclick = () => addLoanForm.classList.remove('hidden');

    card.appendChild(addLoanForm);
    card.appendChild(addButton);

    // Agregar manejador de eventos para el botón eliminar
    const deleteBtn = header.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        try {
            const recordId = e.target.dataset.recordId;
            const type = e.target.dataset.type;
            
            if (!confirm(`¿Estás seguro de eliminar este registro de ${type}?`)) {
                return;
            }

            const activeLoansCount = record.getActiveLoans().length;
            if (activeLoansCount > 0) {
                if (!confirm(`Este registro tiene ${activeLoansCount} préstamo(s) activo(s). ¿Realmente desea eliminarlo?`)) {
                    return;
                }
            }

            // Eliminar de Firebase primero
            if (type === 'deudor') {
                await firebaseService.deleteDebtor(recordId);
                state.debtors = state.debtors.filter(d => d.id !== recordId);
            } else {
                await firebaseService.deleteCreditor(recordId);
                state.creditors = state.creditors.filter(c => c.id !== recordId);
            }

            // Guardar el estado actualizado y refrescar la UI
            await saveState();
            await updateUI();
            
            alert('Registro eliminado correctamente');
        } catch (error) {
            console.error('Error al eliminar:', error);
            alert(`Error al eliminar el registro: ${error.message}`);
        }
    });

    return card;
}

// Función mejorada para crear el botón de eliminar
function createDeleteButton(record, type) {
    const button = document.createElement('button');
    button.className = 'delete-btn';
    button.innerHTML = '🗑️ Eliminar';
    
    button.addEventListener('click', async (event) => {
        event.preventDefault();
        event.stopPropagation();
        
        try {
            // Primera confirmación
            if (!confirm(`¿Estás seguro de eliminar este registro de ${type}?`)) {
                return;
            }

            // Si hay préstamos activos, pedir confirmación adicional
            const activeLoans = record.getActiveLoans?.() || [];
            if (activeLoans.length > 0) {
                if (!confirm(`Este registro tiene ${activeLoans.length} préstamo(s) activo(s). ¿Realmente desea eliminarlo?`)) {
                    return;
                }
            }

            // Intentar eliminar primero de Firebase
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
                    
                default:
                    throw new Error('Tipo de registro no válido');
            }

            // Si la eliminación en Firebase fue exitosa, actualizar el estado y la UI
            await saveState();
            await updateUI();
            alert('Registro eliminado correctamente');

        } catch (error) {
            console.error('Error al eliminar:', error);
            alert(`Error al eliminar el registro: ${error.message}`);
        }
    });

    return button;
}

// Función para crear tarjeta de gasto fijo
function createFixedExpenseCard(expense) {
    const card = document.createElement('div');
    card.className = 'record-card';
    
    // Header
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
    
    card.appendChild(paymentSection);
    card.appendChild(historySection);
    
    return card;
}

// Exportación de las funciones necesarias
export { createRecordCard, createFixedExpenseCard };