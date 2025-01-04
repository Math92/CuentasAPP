// auth.js
const FIREBASE_URL = 'https://cuentasapp-a1f3e-default-rtdb.firebaseio.com/';

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                await authService.login(email, password);
                window.location.href = 'index.html';
            } catch (error) {
                alert('Error: ' + error.message);
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                // Crear el usuario con estructura inicial
                const response = await fetch(`${FIREBASE_URL}/users.json`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email,
                        password,
                        debtors: {},
                        creditors: {},
                        fixedExpenses: {},
                        payments: {},
                        createdAt: new Date().toISOString()
                    })
                });

                if (!response.ok) throw new Error('Error al crear usuario');
                
                const data = await response.json();
                const userInfo = {
                    id: data.name,
                    email
                };
                
                sessionStorage.setItem('currentUser', JSON.stringify(userInfo));
                window.location.href = 'index.html';
            } catch (error) {
                alert('Error al registrar: ' + error.message);
            }
        });
    }
});

export const authService = {
    async login(email, password) {
        try {
            const response = await fetch(`${FIREBASE_URL}/users.json`);
            const users = await response.json();
            
            const user = Object.entries(users).find(([_, userData]) => 
                userData.email === email && userData.password === password
            );

            if (!user) throw new Error('Credenciales inválidas');

            const [userId, userData] = user;
            const userInfo = { id: userId, email: userData.email };
            sessionStorage.setItem('currentUser', JSON.stringify(userInfo));
            return userInfo;
        } catch (error) {
            throw new Error('Error en login: ' + error.message);
        }
    },

    getCurrentUser() {
        const userStr = sessionStorage.getItem('currentUser');
        return userStr ? JSON.parse(userStr) : null;
    },

    logout() {
        sessionStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    },

    checkAuth() {
        const user = this.getCurrentUser();
        if (!user) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }
};