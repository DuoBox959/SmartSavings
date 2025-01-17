document.addEventListener('DOMContentLoaded', () => {
    const enlaces = document.querySelectorAll('.enlace');

    enlaces.forEach(enlace => {
        enlace.addEventListener('click', (e) => {
            alert(`Redirigiendo a: ${enlace.textContent}`);
        });
    });
});
