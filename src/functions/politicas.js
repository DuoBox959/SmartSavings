// Importar funciones necesarias
import { cargarHeaderFooter } from "../functions/global/funciones.js";
import { gestionarUsuarioAutenticado } from "../functions/global/header.js";

// Evento que se ejecuta cuando el DOM se ha cargado completamente
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Cargar el header y el footer dinámicamente
    await cargarHeaderFooter();

    // Llamar a la función para gestionar el usuario autenticado
    gestionarUsuarioAutenticado();

    // Elementos de la barra de navegación
    const registerLink = document.getElementById("registerLink");
    const loginLink = document.getElementById("loginLink");
    const userName = document.getElementById("userName");
    const logout = document.getElementById("logout");
    const userDropdown = document.getElementById("userDropdown");
    const userMenu = document.getElementById("userMenu");

    // Obtener datos del usuario desde sessionStorage o localStorage
    let user =
      JSON.parse(sessionStorage.getItem("user")) ||
      JSON.parse(localStorage.getItem("user"));

    if (user) {
      // Usuario logueado: ocultar los enlaces de "Registrarse" e "Iniciar Sesión"
      registerLink.style.display = "none";
      loginLink.style.display = "none";

      // Mostrar nombre del usuario y el botón de logout
      userName.textContent = `Bienvenido, ${user.name}`;

      // Mostrar el menú desplegable
      userDropdown.style.display = "inline-block";

      // Alternar el menú desplegable al hacer clic en el nombre de usuario
      userName.addEventListener("click", (event) => {
        event.stopPropagation();
        userMenu.classList.toggle("show");
      });

      // Cerrar sesión cuando se haga clic en "Cerrar Sesión"
      logout.addEventListener("click", () => {
        sessionStorage.removeItem("user");
        localStorage.removeItem("user");
        window.location.href = "index.html";
      });

      // Cerrar el menú si se hace clic fuera del dropdown
      document.addEventListener("click", (event) => {
        if (!userDropdown.contains(event.target)) {
          userMenu.classList.remove("show");
        }
      });
    } else {
      // Si no hay usuario logueado, mostrar los enlaces de "Registrarse" y "Iniciar Sesión"
      registerLink.style.display = "inline";
      loginLink.style.display = "inline";

      // Ocultar el nombre del usuario y el botón de logout
      userName.style.display = "none";
      logout.style.display = "none";

      // Ocultar el dropdown
      userDropdown.style.display = "none";
    }
  } catch (error) {
    console.error("Hubo un error durante la inicialización:", error);
  }
});
