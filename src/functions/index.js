// Importar funciones necesarias
import { cargarHeaderFooter } from "../functions/global/funciones.js";
import { gestionarUsuarioAutenticado } from "../functions/global/header.js";
import { cerrarSesion } from "../functions/global/funciones.js";
import { cargarChatbot } from "../functions/global/funciones.js";

// Evento que se ejecuta cuando el DOM se ha cargado completamente
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await cargarHeaderFooter();
    gestionarUsuarioAutenticado();
    manejarCookies();
    manejarUsuario();
    restringirAccesoProductos();
    // await cargarChatbot();
  } catch (error) {
    console.error("Hubo un error durante la inicialización:", error);
  }
});

// Función para manejar las cookies
function manejarCookies() {
  const banner = document.getElementById("cookies-banner");
  const overlay = document.getElementById("overlay");
  const aceptarBtn = document.getElementById("aceptar-cookies");
  const rechazarBtn = document.getElementById("rechazar-cookies");

  function checkCookieExpiration() {
    const cookieData = localStorage.getItem("cookies-aceptadas");
    if (!cookieData) return false;

    try {
      const { timestamp } = JSON.parse(cookieData);
      return Date.now() - timestamp <= 24 * 60 * 60 * 1000;
    } catch (error) {
      console.error("Error al leer las cookies:", error);
      localStorage.removeItem("cookies-aceptadas");
      return false;
    }
  }

  if (checkCookieExpiration()) {
    banner.style.display = "none";
    overlay.style.display = "none";
  } else {
    banner.style.display = "flex";
    overlay.style.display = "block";

    aceptarBtn.addEventListener("click", () => {
      localStorage.setItem(
        "cookies-aceptadas",
        JSON.stringify({ accepted: true, timestamp: Date.now() })
      );
      banner.style.display = "none";
      overlay.style.display = "none";
    });

    rechazarBtn.addEventListener("click", () => {
      // Reemplazamos el alert() por SweetAlert2
      Swal.fire({
        icon: "warning",
        title: "⚠️ Cookies Rechazadas",
        text: "Debes aceptar las cookies para poder acceder a la página.",
        confirmButtonText: "Aceptar",
      });
    });
  }
}

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

// 🛑 Restringir acceso a "Gestión de Productos"
function restringirAccesoProductos() {
  const enlacesProductos = document.querySelectorAll(
    ".tarjetas .tarjeta a[href='productos.html']"
  );

  if (enlacesProductos.length > 0) {
    enlacesProductos.forEach((enlace) => {
      enlace.addEventListener("click", function (event) {
        let user = null;
        try {
          user =
            JSON.parse(sessionStorage.getItem("user")) ||
            JSON.parse(localStorage.getItem("user"));
        } catch (error) {
          console.error("Error al leer los datos del usuario:", error);
        }

        if (!user) {
          event.preventDefault(); // Bloquea la navegación
          // Mostrar una alerta de SweetAlert2 en lugar del alert tradicional
          Swal.fire({
            icon: "warning",
            title: "⚠️ Acceso restringido",
            text: "Debes iniciar sesión para acceder a esta sección.",
            confirmButtonText: "Aceptar",
          });
        }
      });
    });
  }
}
