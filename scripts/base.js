// Clase para manejar préstamos individuales
export class Loan {
    constructor(amount, startDate, description, installments = null) {
        if (amount <= 0) {
            throw new Error('El monto del préstamo debe ser mayor a 0');
        }
        if (installments === 0) {
            throw new Error('El número de cuotas no puede ser 0');
        }

        this.id = Date.now() + Math.random().toString(36).substr(2, 9);
        this.amount = parseFloat(amount);
        this.startDate = startDate;
        this.description = description;
        this.payments = [];
        this.remainingAmount = this.amount;
        this.status = 'active'; // active, completed
        this.installments = installments;
        this.monthlyAmount = installments ? (this.amount / installments).toFixed(2) : null;
        this.type = installments ? 'auto' : 'manual';
    }

    addPayment(amount, date, details = '') {
        const paymentAmount = parseFloat(amount);

        // Depuración: ver los valores de los pagos y el monto restante
        console.log(`Pago solicitado: ${paymentAmount}, Monto restante: ${this.remainingAmount}`);

        // Validar que el monto del pago sea mayor que 0
        if (paymentAmount <= 0) {
            throw new Error('El monto del pago debe ser mayor a 0');
        }

        // Validación de cuotas automáticas
        if (this.type === 'auto' && paymentAmount !== parseFloat(this.monthlyAmount)) {
            throw new Error(`El pago debe ser igual al monto de la cuota: ${this.monthlyAmount}`);
        }

        // Definir una tolerancia para las comparaciones con decimales
        const tolerance = 0.01; // Tolerancia de 0.01 (puedes ajustarlo según sea necesario)

        // Redondear tanto el monto del pago como el monto restante a 2 decimales
        const roundedPaymentAmount = parseFloat(paymentAmount.toFixed(2));
        const roundedRemainingAmount = parseFloat(this.remainingAmount.toFixed(2));

        // Verificar que el pago no exceda el monto restante con tolerancia
        if (roundedPaymentAmount > roundedRemainingAmount + tolerance) {
            throw new Error(`El pago excede el monto restante. Máximo a pagar: ${roundedRemainingAmount}`);
        }

        // Crear el pago
        const payment = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            amount: paymentAmount,
            date: date,
            details: details
        };

        // Registrar el pago
        this.payments.push(payment);

        // Actualizar el monto restante
        this.remainingAmount = parseFloat((this.remainingAmount - paymentAmount).toFixed(2));

        // Verificar si el préstamo está completo
        if (this.remainingAmount <= 0) {
            this.status = 'completed';
            this.remainingAmount = 0; // Para evitar problemas de precisión
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

    getMonthlyInstallmentAmount(yearMonth) {
        if (this.type !== 'auto' || !this.installments) return 0;

        const [year, month] = yearMonth.split('-').map(Number);
        const startDate = new Date(this.startDate);
        // Corregir el cálculo de meses transcurridos
        const elapsedMonths = (year - startDate.getFullYear()) * 12 +
            (month - 1) - startDate.getMonth();

        // Verificar si el préstamo ya está pagado
        if (this.status === 'completed') return 0;

        if (elapsedMonths >= 0 && elapsedMonths < this.installments) {
            return parseFloat(this.monthlyAmount);
        }
        return 0;
    }

    getTotalPaidInMonth(yearMonth) {
        const monthPayments = this.getPaymentsInMonth(yearMonth);
        return monthPayments.reduce((sum, payment) => sum + payment.amount, 0);
    }

    getTotalPaid() {
        return this.payments.reduce((sum, payment) => sum + payment.amount, 0);
    }

    getRemainingInstallments(currentDate = new Date()) {
        if (!this.installments) return null;

        const startDate = new Date(this.startDate);
        const elapsedMonths = (currentDate.getFullYear() - startDate.getFullYear()) * 12 +
            (currentDate.getMonth() - startDate.getMonth());

        return Math.max(0, this.installments - elapsedMonths);
    }
}


// Clase para manejar los registros de deuda/crédito
export class DebtRecord {
    constructor(name, details = '') {
        this.id = Date.now() + Math.random().toString(36).substr(2, 9);
        this.name = name;
        this.details = details;
        this.loans = [];
        this.totalOwed = 0;
    }

    addLoan(amount, startDate, description, installments = null) {
        const loan = new Loan(amount, startDate, description, installments);
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
        const monthlyPayments = this.getAllMonthlyPayments(yearMonth);
        const installmentsDue = this.getInstallmentsDue(yearMonth);

        return {
            personName: this.name,
            totalOwed: this.totalOwed,
            activeLoansCount: this.getActiveLoans().length,
            monthlyPayments,
            totalPaidInMonth: this.getTotalPaidInMonth(yearMonth),
            installmentsDue
        };
    }

    getInstallmentsDue(yearMonth) {
        return this.loans.reduce((total, loan) => {
            return total + loan.getMonthlyInstallmentAmount(yearMonth);
        }, 0);
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