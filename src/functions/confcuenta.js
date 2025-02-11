// Importar funciones necesarias
import { cargarHeaderFooter } from "../functions/global/funciones.js";
import { gestionarUsuarioAutenticado } from "../functions/global/header.js";
import { cerrarSesion } from "../functions/global/funciones.js";

// Evento que se ejecuta cuando el DOM se ha cargado completamente
document.addEventListener("DOMContentLoaded", async () => {
    try {
      await cargarHeaderFooter();
      gestionarUsuarioAutenticado();
      manejarUsuario();
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