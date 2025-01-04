import { loadState, state, saveState } from './states.js';
import { 
    switchTab, 
    clearAllData, 
    updateMonthlyOverview,
    updateUI 
} from './events.js';
import { DebtRecord, FixedExpense } from './base.js';

// Evento de carga inicial
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    
    try {
        // Inicializar en vista general
        switchTab('overview');
        
        // Establecer mes actual
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