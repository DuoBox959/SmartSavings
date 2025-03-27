import { volverAtras } from "../functions/global/funciones.js";

// Seleccionamos elementos del formulario
const loginForm = document.querySelector("form");
const emailOrUsernameInput = document.getElementById("emailOrUsername");
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
async function registrarActividadHistorial(usuarioId, accionTexto) {
  try {
    await fetch("http://localhost:3000/api/historial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usuario_id: usuarioId,
        accion: accionTexto,
      }),
    });
  } catch (error) {
    console.error("❌ Error al registrar historial:", error);
  }
}

// Evento de submit (modificado para aceptar email o username)
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const emailOrUsername = emailOrUsernameInput.value.trim();
  const password = passwordInput.value;

  if (!emailOrUsername || !password) {
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
      body: JSON.stringify({ emailOrUsername, password }),
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

    await registrarActividadHistorial(data.user._id, "Inicio de sesión");

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
