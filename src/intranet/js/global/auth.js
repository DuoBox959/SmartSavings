// Validar si el usuario está autenticado
function verificarAutenticacion() {
  const user = sessionStorage.getItem("user");

  if (!user) {
    alert("⚠️ Debes iniciar sesión para acceder a esta página.");
    window.location.href = "../html/login.html"; // Redirige al login
  }
}

// Ejecutar la verificación al cargar la página
document.addEventListener("DOMContentLoaded", verificarAutenticacion);
