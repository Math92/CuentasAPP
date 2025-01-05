// Clase para manejar préstamos individuales
export class Loan {
    constructor(amount, startDate, description) {
        this.id = Date.now() + Math.random().toString(36).substr(2, 9);
        this.amount = parseFloat(amount);
        this.startDate = startDate;
        this.description = description;
        this.payments = [];
        this.remainingAmount = this.amount;
        this.status = 'active'; // active, completed
    }

    addPayment(amount, date, details = '') {
        // Validar el monto del pago
        const paymentAmount = parseFloat(amount);
        if (paymentAmount <= 0) {
            throw new Error('El monto del pago debe ser mayor a 0');
        }
        if (paymentAmount > this.remainingAmount) {
            throw new Error(`El pago excede el monto restante. Máximo a pagar: ${this.remainingAmount}`);
        }

        const payment = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            amount: paymentAmount,
            date: date,
            details: details
        };
        
        this.payments.push(payment);
        this.remainingAmount = parseFloat((this.remainingAmount - paymentAmount).toFixed(2));

        // Actualizar estado si está completamente pagado
        if (this.remainingAmount <= 0) {
            this.status = 'completed';
            this.remainingAmount = 0; // Asegurar que no quede negativo
        }

        return payment;
    }

    getPaymentsInMonth(yearMonth) {
        const [year, month] = yearMonth.split('-');
        return this.payments.filter(payment => {
            const paymentDate = new Date(payment.date);
            return paymentDate.getFullYear() === parseInt(year) && 
                   paymentDate.getMonth() === parseInt(month) - 1;
        });
    }

    getTotalPaidInMonth(yearMonth) {
        const monthPayments = this.getPaymentsInMonth(yearMonth);
        return monthPayments.reduce((sum, payment) => sum + payment.amount, 0);
    }

    getTotalPaid() {
        return this.payments.reduce((sum, payment) => sum + payment.amount, 0);
    }
}

// Clase para manejar los registros de deuda/crédito
export class DebtRecord {
    constructor(name, details = '') {
        this.id = Date.now() + Math.random().toString(36).substr(2, 9);
        this.name = name;
        this.details = details;
        this.loans = []; // Array de préstamos
        this.totalOwed = 0;
    }

    addLoan(amount, startDate, description) {
        const loan = new Loan(amount, startDate, description);
        this.loans.push(loan);
        this.updateTotalOwed();
        return loan;
    }

    addPaymentToLoan(loanId, amount, date, details = '') {
        const loan = this.loans.find(l => l.id === loanId);
        if (!loan) {
            throw new Error('Préstamo no encontrado');
        }

        if (loan.status === 'completed') {
            throw new Error('Este préstamo ya está completamente pagado');
        }

        try {
            const payment = loan.addPayment(amount, date, details);
            this.updateTotalOwed();
            return payment;
        } catch (error) {
            throw error;
        }
    }

    updateTotalOwed() {
        this.totalOwed = this.loans
            .filter(loan => loan.status === 'active')
            .reduce((sum, loan) => sum + loan.remainingAmount, 0);
    }

    getActiveLoans() {
        return this.loans.filter(loan => loan.status === 'active');
    }

    getCompletedLoans() {
        return this.loans.filter(loan => loan.status === 'completed');
    }

    getMonthlyOverview(yearMonth) {
        return {
            personName: this.name,
            totalOwed: this.totalOwed,
            activeLoansCount: this.getActiveLoans().length,
            monthlyPayments: this.getAllMonthlyPayments(yearMonth),
            totalPaidInMonth: this.getTotalPaidInMonth(yearMonth)
        };
    }

    getAllMonthlyPayments(yearMonth) {
        return this.loans.flatMap(loan => {
            const payments = loan.getPaymentsInMonth(yearMonth);
            return payments.map(payment => ({
                ...payment,
                loanId: loan.id,
                loanDescription: loan.description
            }));
        });
    }

    getTotalPaidInMonth(yearMonth) {
        return this.loans.reduce((sum, loan) => sum + loan.getTotalPaidInMonth(yearMonth), 0);
    }
}

// Clase para gastos fijos
export class FixedExpense {
    constructor(name, amount, paymentDay, details) {
        this.id = Date.now();
        this.name = name;
        this.amount = parseFloat(amount);
        this.paymentDay = parseInt(paymentDay);
        this.details = details;
        this.history = [];
        this.payments = {};
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