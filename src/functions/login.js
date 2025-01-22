// 🔙 Función para regresar a la página anterior
function volverAtras() {
  window.history.back();
}

// Función para autenticar usuarios
async function iniciarSesion(email, password) {
  try {
    // Validación de email y contraseña usando el archivo validaciones.js
    if (!validarEmailYPassword(email, password)) {
      return;
    }

    // Buscar usuario por email en la base de datos
    const resultado = await db.find({
      selector: { email: email },
    });

    if (resultado.docs.length === 0) {
      alert("⚠️ Email no registrado.");
      return;
    }

    const usuario = resultado.docs[0];

    // Verificar contraseña
    if (btoa(password) !== usuario.password) {
      alert("⚠️ Contraseña incorrecta.");
      return;
    }

    alert("✅ Inicio de sesión exitoso.");
    localStorage.setItem("usuario", JSON.stringify(usuario)); // Guarda datos del usuario en localStorage
    window.location.href = "index.html"; // Redirigir a la página principal
  } catch (error) {
    console.error("Error iniciando sesión:", error);
    alert("⚠️ Ocurrió un error al iniciar sesión.");
  }
}

// Manejar el evento de envío del formulario
document.querySelector("form").addEventListener("submit", (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("⚠️ Todos los campos son obligatorios.");
    return;
  }

  // Iniciar sesión
  iniciarSesion(email, password);
});
