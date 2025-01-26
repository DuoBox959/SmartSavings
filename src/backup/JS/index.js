// 🍪 Script para el mensaje de cookies
document.addEventListener("DOMContentLoaded", () => {
  // Manejo del banner de cookies
  const banner = document.getElementById("cookies-banner");
  const overlay = document.getElementById("overlay");
  const aceptarBtn = document.getElementById("aceptar-cookies");
  const rechazarBtn = document.getElementById("rechazar-cookies");

  // Función para verificar si han pasado 24 horas desde la última aceptación de cookies
  function checkCookieExpiration() {
    const cookieData = localStorage.getItem("cookies-aceptadas");
    if (cookieData) {
      const parsedData = JSON.parse(cookieData);
      const now = new Date().getTime();
      const elapsedTime = now - parsedData.timestamp;
      if (elapsedTime > 24 * 60 * 60 * 1000) {
        // 24 horas en milisegundos
        localStorage.removeItem("cookies-aceptadas");
        return false;
      }
      return true;
    }
    return false;
  }

  // Verifica si las cookies fueron aceptadas y gestiona la visibilidad del banner
  if (checkCookieExpiration()) {
    banner.style.display = "none";
    overlay.style.display = "none";
  } else {
    overlay.style.display = "block";
    banner.style.display = "flex";
  }

  // Si se acepta el uso de cookies
  aceptarBtn.addEventListener("click", () => {
    const now = new Date().getTime();
    const cookieData = JSON.stringify({ accepted: true, timestamp: now });
    localStorage.setItem("cookies-aceptadas", cookieData);
    banner.style.display = "none";
    overlay.style.display = "none";
  });

  // Si se rechazan las cookies
  rechazarBtn.addEventListener("click", () => {
    alert("Debes aceptar las cookies para poder acceder a la página.");
  });

  // 🧑‍💻 Lógica de usuario autenticado
  let user =
    JSON.parse(sessionStorage.getItem("user")) ||
    JSON.parse(localStorage.getItem("user")); // Primero intenta en sessionStorage

  const registerLink = document.getElementById("registerLink");
  const loginLink = document.getElementById("loginLink");
  const userName = document.getElementById("userName");
  const logout = document.getElementById("logout");

  // Si el usuario está logueado
  if (user) {
    // Ocultar enlaces de registro e inicio de sesión
    registerLink.style.display = "none";
    loginLink.style.display = "none";

    // Mostrar el nombre del usuario y el enlace de logout
    userName.style.display = "inline";
    userName.textContent = `Bienvenido, ${user.name}`;
    logout.style.display = "inline";

    // Manejar el cierre de sesión
    logout.addEventListener("click", () => {
      sessionStorage.removeItem("user"); // Elimina de sessionStorage
      localStorage.removeItem("user"); // Elimina de localStorage por si acaso
      window.location.href = "index.html"; // Redirige a la página de inicio
    });
  } else {
    // Si no hay usuario logueado, mostrar los enlaces de "Registrarse" y "Iniciar Sesión"
    registerLink.style.display = "inline";
    loginLink.style.display = "inline";

    // Ocultar nombre de usuario y enlace de logout
    userName.style.display = "none";
    logout.style.display = "none";
  }
});
