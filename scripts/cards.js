import { state, saveState, getNext12Months, isMonthCurrentOrFuture } from './states.js';
import { updateUI } from './events.js';

// Función para crear una tarjeta de registro de deuda/crédito
export function createRecordCard(record, isDebtor) {
    const card = document.createElement('div');
    card.className = 'record-card';
    card.dataset.recordId = record.id;
    
    const title = document.createElement('h3');
    title.textContent = record.name;
    card.appendChild(title);

    // Mostrar total adeudado
    const totalAmount = document.createElement('p');
    totalAmount.className = 'total-amount';
    totalAmount.textContent = `Total Pendiente: $${record.totalOwed.toFixed(2)}`;
    card.appendChild(totalAmount);
    
    // Contenedor para préstamos
    const loansContainer = document.createElement('div');
    loansContainer.className = 'loans-container';
    
    // Mostrar préstamos activos
    record.getActiveLoans().forEach(loan => {
        const loanItem = createLoanItem(loan, record.id);
        loansContainer.appendChild(loanItem);
    });

    card.appendChild(loansContainer);
    
    // Formulario desplegable para nuevo préstamo (inicialmente oculto)
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
    
    addLoanForm.onsubmit = (e) => {
        e.preventDefault();
        const amount = e.target.querySelector('.amount-input').value;
        const date = e.target.querySelector('.date-input').value;
        const description = e.target.querySelector('.description-input').value;
        
        if (record) {
            record.addLoan(amount, date, description);
            saveState();
            updateUI();
        }
        
        newLoanSection.classList.add('hidden');
        addLoanButton.classList.remove('hidden');
        e.target.reset();
    };
    
    cancelButton.onclick = () => {
        newLoanSection.classList.add('hidden');
        addLoanButton.classList.remove('hidden');
        addLoanForm.reset();
    };
    
    return card;
}

export function createLoanItem(loan, recordId) {
    const loanItem = document.createElement('div');
    loanItem.className = `loan-item ${loan.status}`;
    loanItem.dataset.loanId = loan.id;
    
    // Encabezado del préstamo
    const header = document.createElement('div');
    header.className = 'loan-header';
    header.innerHTML = `
        <h4>Préstamo: ${loan.description || 'Sin descripción'}</h4>
        <span class="loan-date">Fecha: ${new Date(loan.startDate).toLocaleDateString()}</span>
    `;
    
    // Información de montos
    const amounts = document.createElement('div');
    amounts.className = 'loan-amounts';
    amounts.innerHTML = `
        <p>Monto Original: $${loan.amount.toFixed(2)}</p>
        <p class="remaining-amount ${loan.status === 'completed' ? 'completed' : ''}">
            Saldo Pendiente: $${loan.remainingAmount.toFixed(2)}
        </p>
    `;
    
    // Formulario de pago (solo para préstamos activos)
    if (loan.status === 'active') {
        const paymentForm = document.createElement('form');
        paymentForm.className = 'payment-form';
        paymentForm.innerHTML = `
            <div class="form-group">
                <label>Registrar Pago:</label>
                <input type="number" step="0.01" placeholder="Monto" required>
                <input type="date" required value="${new Date().toISOString().split('T')[0]}">
                <input type="text" placeholder="Detalles del pago">
                <button type="submit">Registrar</button>
            </div>
        `;
        
        paymentForm.onsubmit = (e) => {
            e.preventDefault();
            const [amount, date, details] = e.target.querySelectorAll('input');
            registerPayment(recordId, loan.id, amount.value, date.value, details.value);
            e.target.reset();
        };
        
        loanItem.appendChild(paymentForm);
    }
    
    // Historial de pagos
    const history = document.createElement('div');
    history.className = 'payment-history';
    history.innerHTML = '<h5>Historial de Pagos</h5>';
    
    if (loan.payments.length > 0) {
        const paymentsList = document.createElement('div');
        paymentsList.className = 'payments-list';
        
        loan.payments
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .forEach(payment => {
                const paymentItem = document.createElement('div');
                paymentItem.className = 'payment-item';
                paymentItem.innerHTML = `
                    <span class="payment-date">${new Date(payment.date).toLocaleDateString()}</span>
                    <span class="payment-amount">$${payment.amount.toFixed(2)}</span>
                    ${payment.details ? `<span class="payment-details">${payment.details}</span>` : ''}
                `;
                paymentsList.appendChild(paymentItem);
            });
        
        history.appendChild(paymentsList);
    } else {
        history.innerHTML += '<p class="no-payments">No hay pagos registrados</p>';
    }
    
    loanItem.appendChild(header);
    loanItem.appendChild(amounts);
    loanItem.appendChild(history);
    
    return loanItem;
}

export function createFixedExpenseCard(expense) {
    const card = document.createElement('div');
    card.className = 'record-card';
    
    const header = document.createElement('div');
    header.className = 'card-header';
    header.innerHTML = `
        <h3>${expense.name}</h3>
        <p class="expense-amount">Monto Mensual: $${expense.amount.toFixed(2)}</p>
        <p class="payment-day">Día de pago: ${expense.paymentDay}</p>
        <p class="expense-details">${expense.details || 'Sin detalles'}</p>
    `;
    
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
                    ${payment.amount ? `- Monto: $${payment.amount.toFixed(2)}` : ''}
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