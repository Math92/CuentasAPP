// init.js
import { loadState } from './states.js';
import { switchTab, updateMonthlyOverview } from './events.js';
import { authService } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    if (!authService.checkAuth()) return;

    const user = authService.getCurrentUser();
    const userEmailElement = document.getElementById('user-email');
    if (userEmailElement) {
        userEmailElement.textContent = user.email;
    }

    try {
        await loadState();
        
        switchTab('overview');
        
        const currentDate = new Date();
        const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        const overviewMonth = document.getElementById('overview-month');
        if (overviewMonth) {
            overviewMonth.value = currentMonth;
            updateMonthlyOverview();
        }
    } catch (error) {
        console.error('Error en inicialización:', error);
        authService.logout();
    }
});