// Importar funciones necesarias
import { volverAtras, cerrarSesion } from '../functions/global/funciones.js';
import { db, findUserByEmail } from '../libs/dbuser.js'; // Importar la base de datos y la función de búsqueda

// Asignar funciones a `window`
window.volverAtras = volverAtras;

document.addEventListener('DOMContentLoaded', () => {
  configurarFormulario();
});

// Configurar la lógica del formulario de eliminación
function configurarFormulario() {
  const form = document.querySelector('form');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (password !== confirmPassword) {
      alert('Las contraseñas no coinciden.');
      return;
    }

    const currentUser = JSON.parse(sessionStorage.getItem('user')) || JSON.parse(localStorage.getItem('user'));

    if (!currentUser || currentUser.email !== email) {
      console.error('No se encontró un usuario autenticado o el email no coincide.');
      return;
    }

    try {
      const userDoc = await findUserByEmail(email);

      if (userDoc && userDoc.password === password && userDoc.name === username) {
        await db.remove(userDoc);
        console.log('Cuenta eliminada con éxito.');

        // Cerrar sesión y redirigir al inicio
        sessionStorage.removeItem('user');
        localStorage.removeItem('user');
        alert('Tu cuenta ha sido eliminada correctamente.');
        window.location.href = '../pages/index.html';
      } else {
        console.error('Los datos proporcionados no coinciden con la cuenta.');
        alert('Datos incorrectos. Verifica la información ingresada.');
      }
    } catch (error) {
      console.error('Error al eliminar la cuenta:', error);
    }
  });
}

  
 