// Importar funciones necesarias
import { gestionarUsuarioAutenticado } from "../functions/global/header.js";
import { cerrarSesion, volverAtras } from "../functions/global/funciones.js";
import { db, findUserByEmail } from "../libs/dbuser.js"; // Importar la base de datos y la función de búsqueda

// Asignar funciones a `window`
window.volverAtras = volverAtras;

// Evento que se ejecuta cuando el DOM se ha cargado completamente
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // await cargarHeaderFooter();
    gestionarUsuarioAutenticado();
    manejarUsuario();
    configurarFormulario(); // Configurar la lógica del formulario
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

  const registerLink = document.getElementById("registerLink");
  const loginLink = document.getElementById("loginLink");
  const userDropdown = document.getElementById("userDropdown");
  const userName = document.getElementById("userName");
  const userMenu = document.getElementById("userMenu");
  const logout = document.getElementById("logout");
  const deleteAccount = document.getElementById("deleteAccount");

  // 🛑 Verificar si los elementos existen antes de modificarlos
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

    if (!currentUser || !currentUser.email) {
      return console.error("No se encontró un usuario autenticado.");
    }

    try {
      const userDoc = await findUserByEmail(currentUser.email);

      if (userDoc) {
        // Actualizar los campos del usuario
        userDoc.name = username || userDoc.name;
        userDoc.email = email || userDoc.email;
        userDoc.password = password || userDoc.password;

        // Guardar los cambios en la base de datos
        await db.put(userDoc);
        console.log("Datos actualizados con éxito.");

        // Actualizar los datos en sessionStorage/localStorage
        const updatedUser = {
          ...currentUser,
          name: userDoc.name,
          email: userDoc.email,
        };
        sessionStorage.setItem("user", JSON.stringify(updatedUser));
        localStorage.setItem("user", JSON.stringify(updatedUser));

        alert("Datos actualizados correctamente.");

        // Redirigir al index ya logueado
        window.location.href = "index.html";
      } else {
        console.error("Usuario no encontrado en la base de datos.");
      }
    } catch (error) {
      console.error("Error al actualizar los datos del usuario:", error);
    }
  });
}
