import { db } from "../libs/db.js";

import { validarEmailYPassword } from "../valid/validaciones.js";

// 🔙 Función para regresar a la página anterior
function volverAtras() {
  window.history.back();
}

// Función para registrar usuarios
async function registrarUsuario(nombre, email, password) {
  try {
    // Validación de email y contraseña usando el archivo validaciones.js
    if (!validarEmailYPassword(email, password)) {
      return;
    }

    // Verificar si el email ya está registrado
    const resultado = await db.find({
      selector: { email: email },
    });

    if (resultado.docs.length > 0) {
      alert('⚠️ Este email ya está registrado.');
      return;
    }

    // Crear un nuevo usuario
    const usuario = {
      _id: `user_${new Date().getTime()}`, // ID único basado en el tiempo
      nombre: nombre,
      email: email,
      password: btoa(password), // Encriptar la contraseña
    };

    // Guardar el usuario en la base de datos local
    await db.put(usuario);

    alert('✅ Usuario registrado exitosamente.');

    // Redirigir al login
    window.location.href = "login.html";
  } catch (error) {
    console.error("Error registrando usuario:", error);
    alert("⚠️ Ocurrió un error al registrar el usuario.");
  }
}

// Manejar el evento de envío del formulario
document.querySelector("form").addEventListener("submit", (e) => {
  e.preventDefault();

  const nombre = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const confirmPassword = document.getElementById("confirm-password").value.trim();

  // Validar campos
  if (password !== confirmPassword) {
    alert("⚠️ Las contraseñas no coinciden.");
    return;
  }

  if (!nombre || !email || !password) {
    alert("⚠️ Todos los campos son obligatorios.");
    return;
  }

  // Registrar el usuario
  registrarUsuario(nombre, email, password);
});
