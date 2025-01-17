// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    // Seleccionar todos los elementos con la clase 'enlace'
    const enlaces = document.querySelectorAll('.enlace');

    // Iterar sobre cada enlace
    enlaces.forEach(enlace => {
        enlace.addEventListener('click', (e) => {
            e.preventDefault(); // Prevenir la redirección inmediata
            const destino = enlace.getAttribute('href'); // Obtener el destino del enlace

            // Confirmar la acción con el usuario
            const confirmar = confirm(`¿Quieres redirigirte a: ${enlace.textContent}?`);
            if (confirmar) {
                alert(`Redirigiendo a: ${enlace.textContent}`);
                window.location.href = destino; // Redirigir al destino
            } else {
                alert('Redirección cancelada.');
            }
        });

        // Opcional: Cambiar estilo al pasar el cursor por el enlace
        enlace.addEventListener('mouseenter', () => {
            enlace.style.color = 'blue';
            enlace.style.textDecoration = 'underline';
        });

        enlace.addEventListener('mouseleave', () => {
            enlace.style.color = '';
            enlace.style.textDecoration = '';
        });
    });
});
