// Seleccionamos los elementos del formulario
const loginForm = document.querySelector("form");
const emailOrUsernameInput = document.getElementById("emailOrUsername");
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");  // El icono del ojo
// 🧼 Evitar espacios iniciales y limpiar en blur
[emailOrUsernameInput, passwordInput].forEach((input) => {
  input.addEventListener("input", () => {
    if (input.value.startsWith(" ")) {
      input.value = input.value.trimStart();
    }
  });

  input.addEventListener("blur", () => {
    input.value = input.value.trim();
  });
});

// Evento de click para mostrar/ocultar contraseña
togglePassword.addEventListener("click", () => {
  const type = passwordInput.type === "password" ? "text" : "password";
  passwordInput.type = type;

  // Cambiar el icono del ojo (puedes poner diferentes emojis o usar un icono SVG si prefieres)
  togglePassword.textContent = type === "password" ? "👁️" : "👁️‍🗨️"; // Cambia el icono según el tipo
});

// Evento de submit
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const emailOrUsername = emailOrUsernameInput.value.trim();
  const password = passwordInput.value.trim();

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
        name: data.user.nombre,
        email: data.user.email,
        rol: data.user.rol.toLowerCase(),
      })
    );

    Swal.fire({
      icon: "success",
      title: `✅ Bienvenido, ${data.user.nombre}!`,
      text: "Inicio de sesión exitoso.",
      confirmButtonText: "Aceptar",
    }).then(() => {
      if (data.user.rol.toLowerCase() === "admin") {
        window.location.href = "../html/intranet.html";
      } else {
        window.location.href = "../../pages/index.html";
      }
    });
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "¡Error!",
      text: error.message,
      confirmButtonText: "Aceptar",
    });
  }
});
