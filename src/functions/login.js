import { db } from '../libs/dbuser.js';

const loginForm = document.querySelector('form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = emailInput.value;
  const password = passwordInput.value;

  try {
      // Busca al usuario en la base de datos, asegurando que el ID sea una cadena
      const result = await db.get({ selector: { _id: email.toString() } });

      if (result.docs.length === 0) {
          alert('Usuario no encontrado');
          return;
      }

      const user = result.docs[0];
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      if (error.message === 'id field must contain a string') {
          console.error('El ID del usuario debe ser una cadena de texto');
      } else {
            alert('Contraseña incorrecta');
        }
    
      }
    
});