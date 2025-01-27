import { cargarHeaderFooter } from "../functions/global/funciones.js";
import { gestionarUsuarioAutenticado } from "../functions/global/header.js"; // Importar la función

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Espera a que se carguen el header y footer
    await cargarHeaderFooter();

    const header = document.getElementById("header");
    const footer = document.getElementById("footer");

    if (header && footer) {
      header.style.display = "block";
      footer.style.display = "block";

      // Llama a la función gestionarUsuarioAutenticado
      gestionarUsuarioAutenticado();
    } else {
      console.error("Los elementos #header o #footer no están disponibles.");
    }

    // Manejo del banner de cookies
    const banner = document.getElementById("cookies-banner");
    const overlay = document.getElementById("overlay");
    const aceptarBtn = document.getElementById("aceptar-cookies");
    const rechazarBtn = document.getElementById("rechazar-cookies");

    function checkCookieExpiration() {
      const cookieData = localStorage.getItem("cookies-aceptadas");
      if (cookieData) {
        try {
          const parsedData = JSON.parse(cookieData);
          const now = Date.now();
          const elapsedTime = now - parsedData.timestamp;
          if (elapsedTime > 24 * 60 * 60 * 1000) {
            localStorage.removeItem("cookies-aceptadas");
            return false;
          }
          return true;
        } catch (error) {
          console.error("Error al leer las cookies:", error);
          localStorage.removeItem("cookies-aceptadas");
          return false;
        }
      }
      return false;
    }

    if (checkCookieExpiration()) {
      banner.style.display = "none";
      overlay.style.display = "none";
    } else {
      overlay.style.display = "block";
      banner.style.display = "flex";

      aceptarBtn.addEventListener("click", () => {
        const now = Date.now();
        const cookieData = JSON.stringify({ accepted: true, timestamp: now });
        localStorage.setItem("cookies-aceptadas", cookieData);
        banner.style.display = "none";
        overlay.style.display = "none";
      });

      rechazarBtn.addEventListener("click", () => {
        alert("Debes aceptar las cookies para poder acceder a la página.");
      });
    }

    // Manejo del usuario autenticado
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

    if (user) {
      // Ocultar enlaces de registro e inicio de sesión
      registerLink.style.display = "none";
      loginLink.style.display = "none";

      // Mostrar el menú desplegable
      userDropdown.style.display = "inline-block";
      userName.textContent = `Bienvenido, ${user.name}`;

      // Alternar el menú desplegable
      userName.addEventListener("click", (event) => {
        event.stopPropagation(); // Evita que el clic cierre el menú inmediatamente
        userMenu.classList.toggle("show");
      });

      // Manejar el cierre de sesión
      logout.addEventListener("click", () => {
        sessionStorage.removeItem("user");
        localStorage.removeItem("user");
        window.location.href = "index.html";
      });

      // Borrar cuenta
      deleteAccount.addEventListener("click", () => {
        if (
          confirm("¿Seguro que quieres borrar tu cuenta? Esta acción es irreversible.")
        ) {
          sessionStorage.removeItem("user");
          localStorage.removeItem("user");
          alert("Tu cuenta ha sido eliminada.");
          window.location.href = "index.html";
        }
      });

      // Cerrar el menú si se hace clic fuera
      document.addEventListener("click", (event) => {
        if (!userDropdown.contains(event.target)) {
          userMenu.classList.remove("show");
        }
      });
    } else {
      // Si no hay usuario logueado, mostrar los enlaces de registro e inicio
      registerLink.style.display = "inline";
      loginLink.style.display = "inline";

      // Ocultar menú desplegable
      userDropdown.style.display = "none";
    }
  } catch (error) {
    console.error("Hubo un error durante la inicialización:", error);
  }
});
