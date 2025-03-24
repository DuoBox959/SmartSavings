import { volverAtras } from "../functions/global/funciones.js";

// Asignar funciones a `window`
window.volverAtras = volverAtras;

document.addEventListener("DOMContentLoaded", () => {
  configurarFormulario();
});

async function eliminarUsuario(userId) {
  try {
    const response = await fetch(`http://localhost:3000/api/usuarios/${userId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Error al eliminar la cuenta");
    }

    return await response.json(); // Suponiendo que el servidor devuelve un mensaje de éxito
  } catch (error) {
    console.error("Error en la solicitud:", error);
    Swal.fire("Error", "No se pudo eliminar la cuenta. Inténtalo de nuevo.", "error");
  }
}

// Configurar la lógica del formulario de eliminación
function configurarFormulario() {
  const form = document.querySelector("form");
  const usernameInput = document.getElementById("username");
  const emailInput = document.getElementById("email");

  // Obtener datos del usuario desde sessionStorage o localStorage
  const currentUser = JSON.parse(sessionStorage.getItem("user")) || JSON.parse(localStorage.getItem("user"));

  if (currentUser) {
    usernameInput.value = currentUser.name || "";
    emailInput.value = currentUser.email || "";

    // Hacer los campos de solo lectura
    usernameInput.setAttribute("readonly", true);
    emailInput.setAttribute("readonly", true);
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = usernameInput.value;
    const email = emailInput.value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    if (password !== confirmPassword) {
      Swal.fire("Error", "Las contraseñas no coinciden.", "error");
      return;
    }

    if (!currentUser || currentUser.email !== email) {
      Swal.fire("Error", "No se encontró un usuario autenticado o el email no coincide.", "error");
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/usuarios/email/${email}`);
      const userData = await response.json();

      console.log(userData);  // Imprimir la respuesta de la API para verificar la estructura
      
      if (!response.ok || userData.pass !== password || userData.nombre !== username) {
        Swal.fire("Error", "Los datos proporcionados no coinciden con la cuenta.", "error");
        return;
      }

      Swal.fire({
        title: "¿Estás seguro?",
        text: "Esta acción no se puede deshacer.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar"
      }).then(async (result) => {
        if (result.isConfirmed) {
          // Llamada a la función eliminarUsuario pasando el ID del usuario
          await eliminarUsuario(currentUser.id);
          sessionStorage.removeItem("user");
          localStorage.removeItem("user");

          Swal.fire({
            title: "Cuenta eliminada",
            text: "Tu cuenta ha sido eliminada correctamente, redirigiendo a Inicio.",
            icon: "success",
            confirmButtonText: "Aceptar"
          }).then(() => {
            window.location.href = "../pages/index.html";
          });
        }
      });

    } catch (error) {
      console.error("Error al procesar la solicitud:", error);
      Swal.fire("Error", "Hubo un problema con la eliminación de la cuenta.", "error");
    }
  });
}

// Función para mostrar/ocultar contraseñas
function configurarMostrarContrasena() {
  const passwordField = document.getElementById("password");
  const confirmPasswordField = document.getElementById("confirm-password");
  const togglePasswordButton = document.getElementById("togglePassword");
  const toggleConfirmPasswordButton = document.getElementById("toggleConfirmPassword");

  if (!passwordField || !confirmPasswordField || !togglePasswordButton || !toggleConfirmPasswordButton) return;

  togglePasswordButton.addEventListener("click", () => {
    const isPassword = passwordField.type === "password";
    passwordField.type = isPassword ? "text" : "password";
    togglePasswordButton.textContent = isPassword ? "👁️‍🗨️" : "👁️"; // Cambiar icono: ojo gris cuando está oculto, ojo abierto cuando está visible
  });

  toggleConfirmPasswordButton.addEventListener("click", () => {
    const isConfirmPassword = confirmPasswordField.type === "password";
    confirmPasswordField.type = isConfirmPassword ? "text" : "password";
    toggleConfirmPasswordButton.textContent = isConfirmPassword ? "👁️‍🗨️" : "👁️"; // Cambiar icono: ojo gris cuando está oculto, ojo abierto cuando está visible
  });
}

document.addEventListener("DOMContentLoaded", () => {
  configurarMostrarContrasena();
});



