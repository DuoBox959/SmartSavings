// 📌 login.js - Nueva versión (MongoDB)
import { volverAtras } from "../functions/global/funciones.js";

// Seleccionamos elementos del formulario
const loginForm = document.querySelector("form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

// Hacer el botón de volver atrás funcional
window.volverAtras = volverAtras;

// Evento de submit
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault(); // Evitar recarga de página

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    Swal.fire({
      icon: 'warning',
      title: '⚠️ Campos incompletos',
      text: 'Por favor, completa todos los campos.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }

  try {
    // 🔹 Enviar datos al backend
    const response = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Error en el inicio de sesión");
    }

    // ✅ Guardar la sesión
sessionStorage.setItem("user", JSON.stringify({ 
  id: data.user._id,  // Agregar el ID aquí
  name: data.user.nombre, 
  email: data.user.email,
  role: data.user.rol
}));

    // Mostrar mensaje de éxito con SweetAlert2
    Swal.fire({
      icon: 'success',
      title: `✅ Inicio de sesión exitoso`,
      text: `¡Bienvenido, ${data.user.nombre}!`,
      confirmButtonText: 'Aceptar'
    }).then(() => {
      // Redirigir a la página principal después de cerrar la alerta
      window.location.href = "index.html"; // Redirigir a la página principal
    });

  } catch (error) {
    console.error("❌ Error en login:", error);
    // Mostrar mensaje de error con SweetAlert2
    Swal.fire({
      icon: 'error',
      title: '¡Error!',
      text: error.message,
      confirmButtonText: 'Aceptar'
    });
  }
});
