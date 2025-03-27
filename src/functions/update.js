// Importar funciones necesarias
import { cerrarSesion, volverAtras } from "../functions/global/funciones.js";

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
    // Intentar obtener el usuario desde sessionStorage o localStorage
    user =
      JSON.parse(sessionStorage.getItem("user")) ||
      JSON.parse(localStorage.getItem("user"));
  } catch (error) {
    console.error("Error al leer los datos del usuario:", error);
  }

  // Verificar que el usuario está correctamente asignado
  if (!user || !user.id) {
    console.error("No se encontró un usuario válido.");
    return;
  }

  // Imprimir el objeto user para ver qué contiene
  console.log("Usuario en manejarUsuario:", user);

  const registerLink = document.getElementById("registerLink");
  const loginLink = document.getElementById("loginLink");
  const userDropdown = document.getElementById("userDropdown");
  const userName = document.getElementById("userName");
  const userMenu = document.getElementById("userMenu");
  const logout = document.getElementById("logout");
  const deleteAccount = document.getElementById("deleteAccount");

  // Mostrar los enlaces de usuario o registro
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

// Configurar la lógica del formulario de actualización
function configurarFormulario() {
  const form = document.querySelector("form");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const currentUser =
      JSON.parse(sessionStorage.getItem("user")) ||
      JSON.parse(localStorage.getItem("user"));

    // Verificar que currentUser y currentUser.id estén presentes
    if (!currentUser || !currentUser.id) {
      return console.error(
        "No se encontró un usuario autenticado o el ID es inválido."
      );
    }

    try {
      // Confirmación con SweetAlert
      const result = await Swal.fire({
        title: "¿Estás seguro?",
        text: "¿Quieres actualizar los datos?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, actualizar",
        cancelButtonText: "Cancelar",
      });

      // Si el usuario confirma, proceder con la actualización
      if (result.isConfirmed) {
        // Crear el objeto con los nuevos datos
        const updateData = {
          nombre: username || currentUser.name,
          email: email || currentUser.email,
          pass: password || currentUser.password,
        };

        console.log("Datos enviados:", updateData); // Asegúrate de ver los datos enviados

        // Hacer la solicitud PUT al servidor
        const response = await fetch(
          `http://localhost:3000/api/usuarios/${currentUser.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updateData),
          }
        );

        // Verificar si la respuesta es exitosa
        if (!response.ok) {
          const errorText = await response.text(); // Leer como texto para evitar errores de parseo
          throw new Error(`Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json(); // Si pasó el if, aquí ya es seguro parsear JSON

        console.log(data);

        // Mostrar un mensaje de éxito con SweetAlert
        await Swal.fire({
          title: "¡Éxito!",
          text: "Los datos se han actualizado correctamente, redirigiendo a Inicio.",
          icon: "success",
          confirmButtonText: "Aceptar",
        });

        // Actualizar los datos en sessionStorage/localStorage
        const updatedUser = {
          ...currentUser,
          name: data.usuario.nombre,
          email: data.usuario.email,
        };
        sessionStorage.setItem("user", JSON.stringify(updatedUser));
        localStorage.setItem("user", JSON.stringify(updatedUser));

        // Redirigir al index ya logueado
        window.location.href = "index.html";
      }
    } catch (error) {
      console.error("Error al actualizar los datos del usuario:", error);
    }
  });
}

// Función para mostrar/ocultar contraseña
function configurarMostrarContrasena() {
  const passwordField = document.getElementById("password");
  const toggleButton = document.getElementById("togglePassword");

  if (!passwordField || !toggleButton) return;

  toggleButton.addEventListener("click", () => {
    const isPassword = passwordField.type === "password";
    passwordField.type = isPassword ? "text" : "password";
    toggleButton.textContent = isPassword ? "👁️‍🗨️" : "👁️"; // Cambiar icono
  });
}
