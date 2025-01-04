// firebase-service.js
const FIREBASE_URL = 'https://cuentasapp-a1f3e-default-rtdb.firebaseio.com/';

const handleResponse = async (response) => {
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
};

const getCurrentUserId = () => {
    const userStr = sessionStorage.getItem('currentUser');
    if (!userStr) return null;
    return JSON.parse(userStr).id;
};

export const firebaseService = {
    // Debtors (Deudores)
    async getDebtors() {
        const userId = getCurrentUserId();
        if (!userId) throw new Error('No user authenticated');

        try {
            const response = await fetch(`${FIREBASE_URL}/users/${userId}/debtors.json`);
            const data = await handleResponse(response);
            return data ? Object.keys(data).map(key => ({
                ...data[key],
                id: key
            })) : [];
        } catch (error) {
            console.error('Error:', error);
            return [];
        }
    },

    async saveDebtor(debtor) {
        const userId = getCurrentUserId();
        if (!userId) throw new Error('No user authenticated');

        try {
            const { id, ...debtorData } = debtor;
            const method = id ? 'PUT' : 'POST';
            const url = id ? 
                `${FIREBASE_URL}/users/${userId}/debtors/${id}.json` : 
                `${FIREBASE_URL}/users/${userId}/debtors.json`;

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(debtorData)
            });

            const data = await handleResponse(response);
            return { ...debtorData, id: id || data.name };
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    },

    async deleteDebtor(id) {
        const userId = getCurrentUserId();
        if (!userId) throw new Error('No user authenticated');

        try {
            await fetch(`${FIREBASE_URL}/users/${userId}/debtors/${id}.json`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    },

    // Creditors (Acreedores)
    async getCreditors() {
        const userId = getCurrentUserId();
        if (!userId) throw new Error('No user authenticated');

        try {
            const response = await fetch(`${FIREBASE_URL}/users/${userId}/creditors.json`);
            const data = await handleResponse(response);
            return data ? Object.keys(data).map(key => ({
                ...data[key],
                id: key
            })) : [];
        } catch (error) {
            console.error('Error:', error);
            return [];
        }
    },

    async saveCreditor(creditor) {
        const userId = getCurrentUserId();
        if (!userId) throw new Error('No user authenticated');

        try {
            const { id, ...creditorData } = creditor;
            const method = id ? 'PUT' : 'POST';
            const url = id ? 
                `${FIREBASE_URL}/users/${userId}/creditors/${id}.json` : 
                `${FIREBASE_URL}/users/${userId}/creditors.json`;

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(creditorData)
            });

            const data = await handleResponse(response);
            return { ...creditorData, id: id || data.name };
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    },

    async deleteCreditor(id) {
        const userId = getCurrentUserId();
        if (!userId) throw new Error('No user authenticated');

        try {
            await fetch(`${FIREBASE_URL}/users/${userId}/creditors/${id}.json`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    },

    // Fixed Expenses (Gastos Fijos)
    async getFixedExpenses() {
        const userId = getCurrentUserId();
        if (!userId) throw new Error('No user authenticated');

        try {
            const response = await fetch(`${FIREBASE_URL}/users/${userId}/fixedExpenses.json`);
            const data = await handleResponse(response);
            return data ? Object.keys(data).map(key => ({
                ...data[key],
                id: key
            })) : [];
        } catch (error) {
            console.error('Error:', error);
            return [];
        }
    },

    async saveFixedExpense(expense) {
        const userId = getCurrentUserId();
        if (!userId) throw new Error('No user authenticated');

        try {
            const { id, ...expenseData } = expense;
            const method = id ? 'PUT' : 'POST';
            const url = id ? 
                `${FIREBASE_URL}/users/${userId}/fixedExpenses/${id}.json` : 
                `${FIREBASE_URL}/users/${userId}/fixedExpenses.json`;

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(expenseData)
            });

            const data = await handleResponse(response);
            return { ...expenseData, id: id || data.name };
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    },

    async deleteFixedExpense(id) {
        const userId = getCurrentUserId();
        if (!userId) throw new Error('No user authenticated');

        try {
            await fetch(`${FIREBASE_URL}/users/${userId}/fixedExpenses/${id}.json`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    },

    // Loan Payments (Pagos de Préstamos)
    async saveLoanPayment(debtorId, loanId, payment) {
        const userId = getCurrentUserId();
        if (!userId) throw new Error('No user authenticated');

        try {
            const response = await fetch(
                `${FIREBASE_URL}/users/${userId}/payments/${debtorId}/${loanId}.json`, 
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payment)
                }
            );

            const data = await handleResponse(response);
            return { ...payment, id: data.name };
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    },

    async getLoanPayments(debtorId, loanId) {
        const userId = getCurrentUserId();
        if (!userId) throw new Error('No user authenticated');

        try {
            const response = await fetch(`${FIREBASE_URL}/users/${userId}/payments/${debtorId}/${loanId}.json`);
            const data = await handleResponse(response);
            return data ? Object.keys(data).map(key => ({
                ...data[key],
                id: key
            })) : [];
        } catch (error) {
            console.error('Error:', error);
            return [];
        }
    }
};