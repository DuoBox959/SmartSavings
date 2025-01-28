// Importar funciones necesarias
import { cargarHeaderFooter } from "../functions/global/funciones.js";
import { gestionarUsuarioAutenticado } from "../functions/global/header.js";

// Evento que se ejecuta cuando el DOM se ha cargado completamente
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await cargarHeaderFooter();
    gestionarUsuarioAutenticado();
    manejarCookies();
    manejarUsuario();
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
      localStorage.setItem("cookies-aceptadas", JSON.stringify({ accepted: true, timestamp: Date.now() }));
      banner.style.display = "none";
      overlay.style.display = "none";
    });

    rechazarBtn.addEventListener("click", () => {
      alert("Debes aceptar las cookies para poder acceder a la página.");
    });
  }
}

// Función para manejar el usuario autenticado
function manejarUsuario() {
  let user = null;
  try {
    user = JSON.parse(sessionStorage.getItem("user")) || JSON.parse(localStorage.getItem("user"));
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
    registerLink.style.display = "none";
    loginLink.style.display = "none";
    userDropdown.style.display = "inline-block";
    userName.textContent = `Bienvenido, ${user.name}`;

    userName.addEventListener("click", (event) => {
      event.stopPropagation();
      userMenu.classList.toggle("show");
    });

    logout.addEventListener("click", cerrarSesion);
    deleteAccount.addEventListener("click", borrarCuenta);

    document.addEventListener("click", (event) => {
      if (!userDropdown.contains(event.target)) {
        userMenu.classList.remove("show");
      }
    });
  } else {
    registerLink.style.display = "inline";
    loginLink.style.display = "inline";
    userDropdown.style.display = "none";
  }
}

function cerrarSesion() {
  sessionStorage.removeItem("user");
  localStorage.removeItem("user");
  window.location.href = "index.html";
}

function borrarCuenta() {
  if (confirm("¿Seguro que quieres borrar tu cuenta? Esta acción es irreversible.")) {
    cerrarSesion();
    alert("Tu cuenta ha sido eliminada.");
  }
}
