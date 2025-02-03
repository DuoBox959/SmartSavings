import { db } from '../libs/dbuser.js';
import { volverAtras } from '../functions/global/funciones.js';

const registerForm = document.querySelector('form');
const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

window.volverAtras = volverAtras;

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const username = usernameInput.value;
  const email = emailInput.value;
  const password = passwordInput.value;

  // Validación de campos
  if (!username || !email || !password) {
    alert('Por favor, completa todos los campos.');
    return;
  }

  try {
    // Crear un nuevo usuario en la base de datos
    const newUser = {
      _id: new Date().toISOString(), 
      name: username,               
      email: email,
      password: password,
    };

    await db.put(newUser);

    alert('Usuario registrado correctamente.');
    window.location.href = 'index.html';
  } catch (error) {
    console.error('Error al registrar el usuario:', error);
    alert('Error al registrar el usuario. Por favor, inténtalo de nuevo.');
  }
});