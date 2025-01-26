// Función para manejar el botón "Volver Atrás"
function volverAtras() {
  window.history.back(); // Navega a la página anterior
}

// Hacer accesible la función en el ámbito global
window.volverAtras = volverAtras;

import { db } from '../libs/dbuser.js';

const registerForm = document.querySelector('form');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirm-password');

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const name = nameInput.value;
  const email = emailInput.value;
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  // Validación de campos
  if (!name || !email || !password || !confirmPassword) {
    alert('Por favor, completa todos los campos.');
    return;
  }

  if (password !== confirmPassword) {
    alert('Las contraseñas no coinciden.');
    return;
  }

  try {
    // Crear un nuevo usuario en la base de datos
    const newUser = {
      _id: new Date().toISOString(), // Generar un ID único
      name: name,
      email: email,
      password: password, // En un entorno real, se debería hashear la contraseña
    };

    await db.put(newUser);

    // Redirigir al usuario a la página de inicio de sesión
    window.location.href = 'login.html';
    alert('Usuario registrado correctamente.');
  } catch (error) {
    console.error('Error al registrar el usuario:', error);
    alert('Error al registrar el usuario. Por favor, inténtalo de nuevo.');
  }
});