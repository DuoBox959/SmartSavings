import { volverAtras } from "../functions/global/funciones.js";

// Seleccionamos elementos del formulario
const loginForm = document.querySelector("form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");

// Hacer el botón de volver atrás funcional
window.volverAtras = volverAtras;

// 🔹 Evento para mostrar/ocultar contraseña
togglePassword.addEventListener("click", function () {
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    togglePassword.textContent = "👁️‍🗨️"; // Ojo abierto
  } else {
    passwordInput.type = "password";
    togglePassword.textContent = "👁️"; // Ojo cerrado
  }
});

// Evento de submit (sin cambios)
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    Swal.fire({
      icon: "warning",
      title: "⚠️ Campos incompletos",
      text: "Por favor, completa todos los campos.",
      confirmButtonText: "Aceptar",
    });
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Error en el inicio de sesión");
    }

    sessionStorage.setItem(
      "user",
      JSON.stringify({
        id: data.user._id,
        name: data.user.nombre,
        email: data.user.email,
        role: data.user.rol,
      })
    );

    Swal.fire({
      icon: "success",
      title: `✅ Inicio de sesión exitoso`,
      text: `¡Bienvenido, ${data.user.nombre}!`,
      confirmButtonText: "Aceptar",
    }).then(() => {
      window.location.href = "index.html";
    });
  } catch (error) {
    console.error("❌ Error en login:", error);
    Swal.fire({
      icon: "error",
      title: "¡Error!",
      text: error.message,
      confirmButtonText: "Aceptar",
    });
  }
});


