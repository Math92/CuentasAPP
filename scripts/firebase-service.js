// firebase-service.js
const FIREBASE_URL = 'https://cuentasapp-a1f3e-default-rtdb.firebaseio.com/';

// Función helper para manejar errores
const handleResponse = async (response) => {
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
}; 

export const firebaseService = {
    // Debtors
    async getDebtors() {
        try {
            const response = await fetch(`${FIREBASE_URL}/debtors.json`);
            const data = await handleResponse(response);
            return data ? Object.keys(data).map(key => ({
                ...data[key],
                id: key
            })) : [];
        } catch (error) {
            console.error('Error fetching debtors:', error);
            return [];
        }
    },

    async saveDebtor(debtor) {
        try {
            const { id, ...debtorData } = debtor;
            const method = id ? 'PUT' : 'POST';
            const url = id ? 
                `${FIREBASE_URL}/debtors/${id}.json` : 
                `${FIREBASE_URL}/debtors.json`;

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(debtorData)
            });

            const data = await handleResponse(response);
            return {
                ...debtorData,
                id: id || data.name
            };
        } catch (error) {
            console.error('Error saving debtor:', error);
            throw error;
        }
    },

    async deleteDebtor(id) {
        try {
            const response = await fetch(`${FIREBASE_URL}/debtors/${id}.json`, {
                method: 'DELETE'
            });
            await handleResponse(response);
        } catch (error) {
            console.error('Error deleting debtor:', error);
            throw error;
        }
    },

    // Creditors
    async getCreditors() {
        try {
            const response = await fetch(`${FIREBASE_URL}/creditors.json`);
            const data = await handleResponse(response);
            return data ? Object.keys(data).map(key => ({
                ...data[key],
                id: key
            })) : [];
        } catch (error) {
            console.error('Error fetching creditors:', error);
            return [];
        }
    },

    async saveCreditor(creditor) {
        try {
            const { id, ...creditorData } = creditor;
            const method = id ? 'PUT' : 'POST';
            const url = id ? 
                `${FIREBASE_URL}/creditors/${id}.json` : 
                `${FIREBASE_URL}/creditors.json`;

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(creditorData)
            });

            const data = await handleResponse(response);
            return {
                ...creditorData,
                id: id || data.name
            };
        } catch (error) {
            console.error('Error saving creditor:', error);
            throw error;
        }
    },

    async deleteCreditor(id) {
        try {
            const response = await fetch(`${FIREBASE_URL}/creditors/${id}.json`, {
                method: 'DELETE'
            });
            await handleResponse(response);
        } catch (error) {
            console.error('Error deleting creditor:', error);
            throw error;
        }
    },

    // Fixed Expenses
    async getFixedExpenses() {
        try {
            const response = await fetch(`${FIREBASE_URL}/fixedExpenses.json`);
            const data = await handleResponse(response);
            return data ? Object.keys(data).map(key => ({
                ...data[key],
                id: key
            })) : [];
        } catch (error) {
            console.error('Error fetching fixed expenses:', error);
            return [];
        }
    },

    async saveFixedExpense(expense) {
        try {
            const { id, ...expenseData } = expense;
            const method = id ? 'PUT' : 'POST';
            const url = id ? 
                `${FIREBASE_URL}/fixedExpenses/${id}.json` : 
                `${FIREBASE_URL}/fixedExpenses.json`;

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(expenseData)
            });

            const data = await handleResponse(response);
            return {
                ...expenseData,
                id: id || data.name
            };
        } catch (error) {
            console.error('Error saving fixed expense:', error);
            throw error;
        }
    },

    async deleteFixedExpense(id) {
        try {
            const response = await fetch(`${FIREBASE_URL}/fixedExpenses/${id}.json`, {
                method: 'DELETE'
            });
            await handleResponse(response);
        } catch (error) {
            console.error('Error deleting fixed expense:', error);
            throw error;
        }
    },

    // Loan Payments
    async saveLoanPayment(debtorId, loanId, payment) {
        try {
            const response = await fetch(
                `${FIREBASE_URL}/payments/${debtorId}/${loanId}.json`, 
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payment)
                }
            );

            const data = await handleResponse(response);
            return { ...payment, id: data.name };
        } catch (error) {
            console.error('Error saving loan payment:', error);
            throw error;
        }
    },

    async getLoanPayments(debtorId, loanId) {
        try {
            const response = await fetch(`${FIREBASE_URL}/payments/${debtorId}/${loanId}.json`);
            const data = await handleResponse(response);
            return data ? Object.keys(data).map(key => ({
                ...data[key],
                id: key
            })) : [];
        } catch (error) {
            console.error('Error fetching loan payments:', error);
            return [];
        }
    }
};