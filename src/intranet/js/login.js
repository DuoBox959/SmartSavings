import * as validaciones from '../../valid/validaciones.js';

// 🧩 Elementos del DOM
const loginForm = document.querySelector("form");
const emailOrUsernameInput = document.getElementById("emailOrUsername");
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");

// 🧼 Limpieza de espacios iniciales
[emailOrUsernameInput, passwordInput].forEach((input) => {
  input.addEventListener("input", () => {
    input.value = input.value.trimStart();
  });

  input.addEventListener("blur", () => {
    input.value = validaciones.limpiarEspacios(input.value);
  });
});

// 👁️ Mostrar/Ocultar contraseña
togglePassword.addEventListener("click", () => {
  const type = passwordInput.type === "password" ? "text" : "password";
  passwordInput.type = type;
  togglePassword.textContent = type === "password" ? "👁️" : "👁️‍🗨️";
});

// 🚀 Login con validaciones
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const emailOrUsername = validaciones.limpiarEspacios(emailOrUsernameInput.value);
  const password = validaciones.limpiarEspacios(passwordInput.value);

  // 🔒 Validaciones
  if (validaciones.camposVacios(emailOrUsername, password)) {
    return validaciones.mostrarAlertaError("⚠️ Campos incompletos", "Por favor, completa todos los campos.");
  }

  if (emailOrUsername.includes("@") && !validaciones.esEmailValido(emailOrUsername)) {
    return validaciones.mostrarAlertaError("📧 Email inválido", "El formato del correo electrónico no es válido.");
  }

  if (!validaciones.esPasswordSegura(password)) {
    return validaciones.mostrarAlertaError("🔐 Contraseña insegura", "La contraseña debe tener al menos 6 caracteres.");
  }

  // 📡 Enviar al backend
  try {
    const response = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailOrUsername, password }),
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error || "Error en el inicio de sesión");

    // 💾 Guardar sesión
    sessionStorage.setItem("user", JSON.stringify({
      _id: data.user._id,
      name: data.user.nombre,
      email: data.user.email,
      rol: data.user.rol.toLowerCase(),
    }));

    console.log("✅ Usuario guardado en sessionStorage:", JSON.parse(sessionStorage.getItem("user")));

    // 🕓 Historial
    await registrarActividadHistorial(data.user._id, "Inicio de sesión");

    // 🎉 Éxito
    Swal.fire({
      icon: "success",
      title: `✅ Bienvenido, ${data.user.nombre}!`,
      text: "Inicio de sesión exitoso.",
      confirmButtonText: "Continuar",
    }).then(() => {
      const ruta = data.user.rol.toLowerCase() === "admin"
        ? "../html/intranet.html"
        : "../../pages/index.html";
      window.location.href = ruta;
    });

  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Error de autenticación",
      text: error.message,
      confirmButtonText: "Aceptar",
    });
  }
});

// 🕓 Registro de actividad
async function registrarActividadHistorial(usuarioId, accionTexto) {
  try {
    await fetch("http://localhost:3000/api/historial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario_id: usuarioId, accion: accionTexto }),
    });
  } catch (error) {
    console.error("❌ Error al registrar historial:", error);
  }
}
