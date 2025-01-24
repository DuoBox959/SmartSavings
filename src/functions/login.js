// Importa la base de datos y la función de búsqueda desde dbuser.js
import { db, findUserByEmail } from '../libs/dbuser.js';

// Selecciona los elementos del formulario
const loginForm = document.querySelector('form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

// Agrega un listener al evento submit del formulario
loginForm.addEventListener('submit', async (event) => {
  event.preventDefault(); // Previene el comportamiento predeterminado del formulario

  const email = emailInput.value.trim(); // Obtiene y limpia el email
  const password = passwordInput.value; // Obtiene la contraseña

  if (!email || !password) {
    alert('Por favor, completa todos los campos.');
    return;
  }

  try {
    // Intenta obtener el documento del usuario desde la base de datos
    const user = await findUserByEmail(email);

    if (user) {
      // Compara la contraseña ingresada con la almacenada
      if (user.password === password) {
        alert('Inicio de sesión exitoso');
        console.log('Usuario autenticado:', user);
        
        // Guardar el estado del usuario en el localStorage para mantenerlo conectado
        localStorage.setItem('user', JSON.stringify(user));

        // Redirigir al usuario a index.html
        window.location.href = 'index.html';
      } else {
        alert('Contraseña incorrecta');
      }
    } else {
      alert('Usuario no encontrado');
    }
  } catch (error) {
    // Maneja los errores
    console.error('Error al iniciar sesión:', error);
    alert('Ocurrió un error al intentar iniciar sesión. Inténtalo nuevamente.');
  }
});
