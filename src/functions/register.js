import { volverAtras } from "../functions/global/funciones.js";
import * as validaciones from "../valid/validaciones.js";

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

// Expresión regular para validar nombres de usuario
const usernameRegex = /^(?!-)[a-zA-Z0-9-]+(?<!-)$/;

// Evento de envío del formulario
registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = usernameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  const role = "usuario"; // Valor por defecto

  // ✅ Validación de campos vacíos
  if (validaciones.camposVacios(username, email, password)) {
    validaciones.mostrarAlertaError("⚠️ Campos incompletos", "Por favor, completa todos los campos.");
    return;
  }

  // ✅ Validación de email
  if (!validaciones.esEmailValido(email)) {
    validaciones.mostrarAlertaError("⚠️ Email inválido", "Por favor, ingresa un email válido.");
    return;
  }

  // ✅ Validación de contraseña (mínimo 8 caracteres)
  if (!validaciones.esPasswordSegura(password)) {
    validaciones.mostrarAlertaError("⚠️ Contraseña débil", "La contraseña debe tener al menos 8 caracteres, un número y una letra minúscula.");
    return;
}

  // ✅ Validación de nombre de usuario
  if (!usernameRegex.test(username)) {
    validaciones.mostrarAlertaError(
      "⚠️ Usuario inválido",
      "El usuario solo puede contener caracteres alfanuméricos y guiones (-), sin empezar ni terminar con guión."
    );
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

// ❌ No permitir espacios en email, password y username
const inputsSinEspacios = ['email', 'password', 'username'];

inputsSinEspacios.forEach(id => {
  const input = document.getElementById(id);

  if (input) {
    // Evita que se presione la barra espaciadora
    input.addEventListener('keydown', (e) => {
      if (e.key === ' ') {
        e.preventDefault();
      }
    });

    // Elimina cualquier espacio pegado desde el portapapeles
    input.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\s/g, '');
    });
  }
});

// ✅ Mostrar/Ocultar lista de beneficios
const toggleBtn = document.getElementById('toggle-benefits');
const benefitsList = document.getElementById('benefits-list');

if (toggleBtn && benefitsList) {
  toggleBtn.addEventListener('click', () => {
    const isHidden = benefitsList.classList.toggle('hidden');
    toggleBtn.textContent = isHidden
      ? 'Ver qué está incluido ▼'
      : 'Ocultar beneficios ▲';
  });
}
