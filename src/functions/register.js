import { volverAtras } from "../functions/global/funciones.js";

// Obtener el botón de regreso
const backButton = document.querySelector(".back-button");
backButton.addEventListener("click", volverAtras);

// Obtener elementos del formulario
const registerForm = document.getElementById("register-form");
const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");

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

// Evento de envío del formulario
registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = usernameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  const role = "usuario"; // Valor por defecto

  // Validación de campos
  if (!username || !email || !password) {
    Swal.fire({
      icon: "warning",
      title: "⚠️ Campos incompletos",
      text: "Por favor, completa todos los campos.",
      confirmButtonText: "Aceptar",
    });
    return;
  }

  // Crear objeto con datos del usuario
  const newUser = {
    nombre: username,
    pass: password,
    email: email,
    rol: role,
  };

  try {
    // Enviar los datos al backend
    const response = await fetch("http://localhost:3000/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });

    const data = await response.json();

    if (response.ok) {
      Swal.fire({
        icon: "success",
        title: "🎉 Registro exitoso",
        text: "Usuario registrado correctamente. Redirigiendo...",
        confirmButtonText: "Aceptar",
      }).then(() => {
        window.location.href = "index.html";
      });
    } else {
      throw new Error(data.error || "Error al registrar el usuario.");
    }
  } catch (error) {
    console.error("❌ Error al registrar el usuario:", error);
    Swal.fire({
      icon: "error",
      title: "❌ Error",
      text: "Hubo un problema al registrar el usuario. Inténtalo de nuevo.",
      confirmButtonText: "Intentar de nuevo",
    });
  }
});
