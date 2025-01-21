// 🍪 Script para el mensaje de cookies
document.addEventListener('DOMContentLoaded', () => {
    const banner = document.getElementById('cookies-banner');
    const overlay = document.getElementById('overlay');
    const aceptarBtn = document.getElementById('aceptar-cookies');
    const rechazarBtn = document.getElementById('rechazar-cookies');

    // Función para verificar si han pasado 24 horas
    function checkCookieExpiration() {
        const cookieData = localStorage.getItem('cookies-aceptadas');
        if (cookieData) {
            const parsedData = JSON.parse(cookieData); // Parseamos el JSON guardado
            const now = new Date().getTime();
            const elapsedTime = now - parsedData.timestamp;
            // 24 horas = 24 * 60 * 60 * 1000 ms
            if (elapsedTime > 24 * 60 * 60 * 1000) {
                localStorage.removeItem('cookies-aceptadas');
                return false; // Cookies han expirado
            }
            return true; // Cookies todavía son válidas
        }
        return false; // No hay cookies guardadas
    }

    // Verifica el estado de las cookies al cargar la página
    if (checkCookieExpiration()) {
        banner.style.display = 'none'; // Oculta el banner si ya fue aceptado
        overlay.style.display = 'none'; // Oculta la superposición
    } else {
        overlay.style.display = 'block'; // Muestra la superposición si no se aceptaron
        banner.style.display = 'flex'; // Muestra el banner
    }

    // Escucha el clic en el botón de aceptar
    aceptarBtn.addEventListener('click', () => {
        const now = new Date().getTime(); // Obtiene el tiempo actual en ms
        const cookieData = JSON.stringify({ accepted: true, timestamp: now });
        localStorage.setItem('cookies-aceptadas', cookieData);
        banner.style.display = 'none'; // Oculta el banner
        overlay.style.display = 'none'; // Oculta la superposición
    });

    // Escucha el clic en el botón de rechazar
    rechazarBtn.addEventListener('click', () => {
        alert('Debes aceptar las cookies para poder acceder a la página.');
    });
});