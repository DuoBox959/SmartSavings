// Importar funciones necesarias
import { cargarHeaderFooter } from "../functions/global/funciones.js";
import { gestionarUsuarioAutenticado } from "../functions/global/header.js";
import { cerrarSesion } from "../functions/global/funciones.js";
import * as validaciones from "../valid/validaciones.js";

// Evento principal
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await cargarHeaderFooter();
    gestionarUsuarioAutenticado();
    manejarUsuario();
    await cargarDatosPersonales(); // 👈 Cargar datos ya guardados
  } catch (error) {
    console.error("Hubo un error durante la inicialización:", error);
  }
});

// Manejar usuario logueado
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

// Guardar datos personales
// Guardar datos personales
document.querySelector(".btn.guardar").addEventListener("click", async () => {
  try {
    const nombre = document.getElementById("nombre").value.trim();
    const apellidos = document.getElementById("apellidos").value.trim();
    const usuario = document.getElementById("usuario").value.trim();
    const fechaNacimiento = document.getElementById("fecha-nacimiento").value;
    const genero = document.getElementById("genero").value;
    const idioma = document.getElementById("idioma").value;
    const zonaHoraria = document.getElementById("zona-horaria").value.trim();
    const notificaciones = document.getElementById("notificaciones").checked;

    // Validaciones de los campos usando validaciones.js
    if (validaciones.camposVacios(nombre, apellidos, zonaHoraria)) {
      validaciones.mostrarAlertaError(
        "Campos incompletos",
        "Por favor, completa todos los campos requeridos."
      );
      return;
    }

    if (!validaciones.esFechaValida(fechaNacimiento)) {
      validaciones.mostrarAlertaError(
        "Fecha inválida",
        "La fecha de nacimiento no es válida."
      );
      return;
    }

    const user =
      JSON.parse(sessionStorage.getItem("user")) ||
      JSON.parse(localStorage.getItem("user"));

    if (!user || !user.id) {
      validaciones.mostrarAlertaError(
        "Usuario no identificado",
        "⚠️ No se pudo identificar al usuario."
      );
      return;
    }

    const datos = {
      usuario_id: user.id,
      nombre,
      apellidos,
      usuario,
      fechaNacimiento,
      genero,
      idioma,
      zonaHoraria,
      recibirNotificaciones: notificaciones,
    };

    // Comprobar si ya existen datos personales para este usuario
    const check = await fetch(
      `http://localhost:3000/api/datos-personales?usuario_id=${user.id}`
    );
    const existentes = await check.json();

    let response;
    if (existentes.length > 0) {
      // Si ya existen, actualizamos el registro
      const idExistente = existentes[0]._id;
      response = await fetch(
        `http://localhost:3000/api/datos-personales/${idExistente}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...datos,
            usuario_id: user.id, // Aseguramos que el usuario_id sea el correcto
          }),
        }
      );
    } else {
      // Si no existen, creamos uno nuevo
      response = await fetch("http://localhost:3000/api/datos-personales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...datos,
          usuario_id: user.id,
        }),
      });
    }

    const result = await response.json();

    if (response.ok) {
      Swal.fire({
        icon: "success",
        title: "Configuración guardada",
        text: "✅ Configuración guardada correctamente.",
        confirmButtonText: "Aceptar",
      });
    } else {
      throw new Error(result.error || "Error desconocido.");
    }
  } catch (error) {
    console.error("❌ Error al guardar la configuración:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "❌ Hubo un problema al guardar la configuración.",
      confirmButtonText: "Aceptar",
    });
  }
});

// Cargar datos ya guardados del usuario
async function cargarDatosPersonales() {
  try {
    const user =
      JSON.parse(sessionStorage.getItem("user")) ||
      JSON.parse(localStorage.getItem("user"));

    if (!user || !user.id) return;

    const response = await fetch(
      `http://localhost:3000/api/datos-personales?usuario_id=${user.id}`
    );
    const datos = await response.json();

    const datosUsuario = datos.length > 0 ? datos[0] : null;

    // 🔒 Nombre de usuario: siempre mostrado, siempre readonly
    const usuarioInput = document.getElementById("usuario");
    usuarioInput.value = datosUsuario?.usuario || user.name || "";
    usuarioInput.readOnly = true;

    // ✅ Rellenar o dejar vacíos el resto de campos (todos editables)
    document.getElementById("nombre").value = datosUsuario?.nombre || "";
    document.getElementById("apellidos").value = datosUsuario?.apellidos || "";
    document.getElementById("fecha-nacimiento").value =
      datosUsuario?.fechaNacimiento || "";
    document.getElementById("genero").value =
      datosUsuario?.genero || "masculino";
    document.getElementById("idioma").value = datosUsuario?.idioma || "es";
    document.getElementById("zona-horaria").value =
      datosUsuario?.zonaHoraria || "";
    document.getElementById("notificaciones").checked =
      datosUsuario?.recibirNotificaciones || false;
  } catch (error) {
    console.error("❌ Error cargando datos personales:", error);
  }
}

// ✅ Campos donde solo queremos evitar espacios al principio
const camposEvitarEspaciosInicio = ["nombre", "apellidos", "zona-horaria"];

camposEvitarEspaciosInicio.forEach((id) => {
  const input = document.getElementById(id);

  if (input) {
    input.addEventListener("input", (e) => {
      // Elimina espacios al principio del valor
      e.target.value = e.target.value.replace(/^\s+/, "");
    });
  }
});
