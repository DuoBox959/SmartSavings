// Importar funciones necesarias
import { cerrarSesion, volverAtras } from "../functions/global/funciones.js";
import * as validaciones from "../valid/validaciones.js";

// Asignar funciones a `window`
window.volverAtras = volverAtras;

// Evento que se ejecuta cuando el DOM se ha cargado completamente
document.addEventListener("DOMContentLoaded", async () => {
  try {
    manejarUsuario();
    configurarFormulario();
    configurarMostrarContrasena();
  } catch (error) {
    console.error("Hubo un error durante la inicialización:", error);
  }
});

// Función para manejar el usuario autenticado
function manejarUsuario() {
  let user = null;
  try {
    user =
      JSON.parse(sessionStorage.getItem("user")) ||
      JSON.parse(localStorage.getItem("user"));
  } catch (error) {
    console.error("Error al leer los datos del usuario:", error);
  }

  if (!user || !user.id) {
    console.error("No se encontró un usuario válido.");
    return;
  }

  console.log("Usuario en manejarUsuario:", user);

  const registerLink = document.getElementById("registerLink");
  const loginLink = document.getElementById("loginLink");
  const userDropdown = document.getElementById("userDropdown");
  const userName = document.getElementById("userName");
  const userMenu = document.getElementById("userMenu");
  const logout = document.getElementById("logout");
  const deleteAccount = document.getElementById("deleteAccount");

  if (registerLink && loginLink && userDropdown) {
    if (user) {
      registerLink.style.display = "none";
      loginLink.style.display = "none";
      userDropdown.style.display = "inline-block";

      if (userName) userName.textContent = `Bienvenido, ${user.name}`;

      if (userName) {
        userName.addEventListener("click", (event) => {
          event.stopPropagation();
          if (userMenu) userMenu.classList.toggle("show");
        });
      }

      if (logout) logout.addEventListener("click", cerrarSesion);
      if (deleteAccount) deleteAccount.addEventListener("click", borrarCuenta);

      document.addEventListener("click", (event) => {
        if (!userDropdown.contains(event.target) && userMenu) {
          userMenu.classList.remove("show");
        }
      });
    } else {
      registerLink.style.display = "inline";
      loginLink.style.display = "inline";
      userDropdown.style.display = "none";
    }
  }
}

// 🧠 VALIDACIONES USANDO EL MÓDULO
function configurarFormulario() {
  const form = document.querySelector("form");
  const usernameInput = document.getElementById("username");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  // 🔸 Evento submit del formulario
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!username && !email && !password) {
      return Swal.fire({
        title: "Campos vacíos",
        text: "Debes ingresar al menos un dato para actualizar.",
        icon: "error",
        confirmButtonText: "Aceptar"
      });
    }

    if (username && !validaciones.esUsernameValido(username)) {
      return Swal.fire({
        title: "Nombre de usuario inválido",
        text: "Solo se permiten caracteres alfanuméricos y guiones. No puede comenzar ni terminar con un guión, ni contener espacios.",
        icon: "error",
        confirmButtonText: "Aceptar"
      });
    }

    if (email && !validaciones.esEmailValido(email)) {
      return Swal.fire({
        title: "Email inválido",
        text: "Por favor, ingresa un email válido.",
        icon: "error",
        confirmButtonText: "Aceptar"
      });
    }

    if (password && !validaciones.esPasswordSegura(password)) {
      return Swal.fire({
        title: "Contraseña inválida",
        text: "Debe contener al menos: 8 caracteres, Una letra minúscula, Un número",
        icon: "error",
        confirmButtonText: "Aceptar"
      });
    }

    const currentUser = JSON.parse(sessionStorage.getItem("user")) || JSON.parse(localStorage.getItem("user"));

    if (!currentUser || !currentUser.id) {
      return console.error("No se encontró un usuario autenticado o el ID es inválido.");
    }

    try {
      const result = await Swal.fire({
        title: "¿Estás seguro?",
        text: "¿Quieres actualizar los datos?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, actualizar",
        cancelButtonText: "Cancelar",
      });

      if (result.isConfirmed) {
        const updateData = {
          nombre: username || currentUser.name,
          email: email || currentUser.email,
          pass: password || currentUser.password,
        };

        const response = await fetch(`http://localhost:3000/api/usuarios/${currentUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        await Swal.fire({
          title: "¡Éxito!",
          text: "Los datos se han actualizado correctamente, redirigiendo a Inicio.",
          icon: "success",
          confirmButtonText: "Aceptar",
        });

        const updatedUser = {
          ...currentUser,
          name: data.usuario.nombre,
          email: data.usuario.email,
        };
        sessionStorage.setItem("user", JSON.stringify(updatedUser));
        localStorage.setItem("user", JSON.stringify(updatedUser));

        window.location.href = "index.html";
      }
    } catch (error) {
      console.error("Error al actualizar los datos del usuario:", error);
    }
  });
}


// Mostrar/ocultar contraseña
function configurarMostrarContrasena() {
  const passwordField = document.getElementById("password");
  const toggleButton = document.getElementById("togglePassword");

  if (!passwordField || !toggleButton) return;

  toggleButton.addEventListener("click", () => {
    const isPassword = passwordField.type === "password";
    passwordField.type = isPassword ? "text" : "password";
    toggleButton.textContent = isPassword ? "👁️‍🗨️" : "👁️";
  });
}

