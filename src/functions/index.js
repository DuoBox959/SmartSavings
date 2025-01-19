// 🍪 Script para el mensaje de cookies
document.addEventListener('DOMContentLoaded', () => {
    const banner = document.getElementById('cookies-banner');
    const overlay = document.getElementById('overlay');
    const aceptarBtn = document.getElementById('aceptar-cookies');
    const rechazarBtn = document.getElementById('rechazar-cookies');

    // Comprueba si ya se aceptaron las cookies
    if (localStorage.getItem('cookies-aceptadas')) {
        banner.style.display = 'none'; // Oculta el banner si ya fue aceptado
        overlay.style.display = 'none'; // Oculta la superposición
    } else {
        overlay.style.display = 'block'; // Muestra la superposición si no se aceptaron
        banner.style.display = 'flex'; // Muestra el banner
    }

    // Escucha el clic en el botón de aceptar
    aceptarBtn.addEventListener('click', () => {
        localStorage.setItem('cookies-aceptadas', 'true'); // Guarda la preferencia
        banner.style.display = 'none'; // Oculta el banner
        overlay.style.display = 'none'; // Oculta la superposición
    });

    // Escucha el clic en el botón de rechazar
    rechazarBtn.addEventListener('click', () => {
        alert('Debes aceptar las cookies para poder acceder a la página.');
    });
});


