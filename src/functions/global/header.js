export function gestionarUsuarioAutenticado() {
  let user =
    JSON.parse(sessionStorage.getItem("user")) ||
    JSON.parse(localStorage.getItem("user")); // Primero intenta en sessionStorage

  const registerLink = document.getElementById("registerLink");
  const loginLink = document.getElementById("loginLink");
  const userMenu = document.getElementById("userMenu");
  const userName = document.getElementById("userName");
  const logout = document.getElementById("logout");
  const changeUser = document.getElementById("changeUser");
  const del = document.getElementById("delete");

  console.log(user); // Verifica si el usuario está correctamente cargado

  if (
    registerLink &&
    loginLink &&
    userMenu &&
    userName &&
    logout &&
    changeUser &&
    del
  ) {
    if (user) {
      // Ocultar enlaces de registro e inicio de sesión
      registerLink.style.display = "none";
      loginLink.style.display = "none";

      // Mostrar el menú de usuario
      userMenu.style.display = "inline-block";
      userName.textContent = `Bienvenido, ${user.name}`;

      // Función para cerrar sesión
      logout.addEventListener("click", () => {
        sessionStorage.removeItem("user");
        localStorage.removeItem("user");
        window.location.reload(); // Recarga la página después de cerrar sesión
      });

      // Función para cambiar de usuario
      changeUser.addEventListener("click", () => {
        window.location.href = "login.html";
      });
    } else {
      // Mostrar enlaces de registro e inicio de sesión
      registerLink.style.display = "inline";
      loginLink.style.display = "inline";

      // Ocultar el menú de usuario
      userMenu.style.display = "none";
    }
  } else {
    console.error("Algunos elementos no están presentes en el DOM.");
  }
}
