document.addEventListener("DOMContentLoaded", () => {
  // Elementos de la barra de navegación
  const registerLink = document.getElementById("registerLink");
  const loginLink = document.getElementById("loginLink");
  const userName = document.getElementById("userName");
  const logout = document.getElementById("logout");
  const userDropdown = document.getElementById("userDropdown"); // Contenedor del dropdown
  const userMenu = document.getElementById("userMenu"); // Menú desplegable

  // Obtener datos del usuario desde sessionStorage o localStorage
  let user =
    JSON.parse(sessionStorage.getItem("user")) ||
    JSON.parse(localStorage.getItem("user")); // Primero intenta en sessionStorage

  if (user) {
    // Usuario logueado: ocultar los enlaces de "Registrarse" e "Iniciar Sesión"
    registerLink.style.display = "none";
    loginLink.style.display = "none";

    // Mostrar nombre del usuario y el botón de logout
    userName.style.display = "inline";
    userName.textContent = `Bienvenido, ${user.name}`;
    logout.style.display = "inline";

    // Mostrar el menú desplegable
    userDropdown.style.display = "inline-block";

    // Alternar el menú desplegable al hacer clic en el nombre de usuario
    userName.addEventListener("click", (event) => {
      event.stopPropagation(); // Evita que el evento se propague y cierre el menú inmediatamente
      userMenu.classList.toggle("show"); // Activa o desactiva el dropdown
    });

    // Cerrar sesión cuando se haga clic en "Cerrar Sesión"
    logout.addEventListener("click", () => {
      sessionStorage.removeItem("user"); // Elimina de sessionStorage
      localStorage.removeItem("user"); // Elimina de localStorage por si acaso
      window.location.href = "index.html"; // Redirige a la página de inicio
    });

    // Cerrar el menú si se hace clic fuera del dropdown
    document.addEventListener("click", (event) => {
      if (!userDropdown.contains(event.target)) {
        userMenu.classList.remove("show"); // Cierra el dropdown si haces clic fuera
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
});

  