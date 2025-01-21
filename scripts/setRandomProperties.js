// Función para establecer propiedades aleatorias de CSS
function setRandomProperties() {
    try {
        // Tamaños aleatorios para los gradientes
        const randomSize1 = Math.random() * 100;
        const randomSize2 = Math.random() * 100;
        const randomSize3 = Math.random() * 100;

        // Posiciones aleatorias para los gradientes
        const randomPos1 = Math.random() * 100;
        const randomPos2 = Math.random() * 100;
        const randomPos3 = Math.random() * 100;
        const randomPos4 = Math.random() * 100;
        const randomPos5 = Math.random() * 100;
        const randomPos6 = Math.random() * 100;

        // Establecer las propiedades CSS
        document.documentElement.style.setProperty('--random-size-1', randomSize1 + 'px');
        document.documentElement.style.setProperty('--random-size-2', randomSize2 + 'px');
        document.documentElement.style.setProperty('--random-size-3', randomSize3 + 'px');
        
        document.documentElement.style.setProperty('--random-pos-1', randomPos1);
        document.documentElement.style.setProperty('--random-pos-2', randomPos2);
        document.documentElement.style.setProperty('--random-pos-3', randomPos3);
        document.documentElement.style.setProperty('--random-pos-4', randomPos4);
        document.documentElement.style.setProperty('--random-pos-5', randomPos5);
        document.documentElement.style.setProperty('--random-pos-6', randomPos6);
    } catch (error) {
        console.error('Error setting random properties:', error);
    }
}

// Establecer propiedades aleatorias al cargar la página
document.addEventListener('DOMContentLoaded', setRandomProperties);

// Regenerar cada cierto tiempo (por ejemplo, cada 10 segundos)
setInterval(setRandomProperties, 10000);