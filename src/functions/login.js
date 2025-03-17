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
    alert("⚠️ Por favor, completa todos los campos.");
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
      name: data.user.nombre, 
      email: data.user.email,
      role: data.user.rol
    }));

    alert(`✅ Inicio de sesión exitoso. ¡Bienvenido, ${data.user.nombre}!`);
    window.location.href = "index.html"; // Redirigir a la página principal
  } catch (error) {
    console.error("❌ Error en login:", error);
    alert(error.message);
  }
});
