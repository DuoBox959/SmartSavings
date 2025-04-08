import * as validaciones from "../../valid/validaciones.js";

// 🔹 Variables globales
let usuariosTable;
let usuariosCache = [];

// 🔹 Iniciar DataTable y cargar usuarios cuando el documento esté listo
$(document).ready(() => {
  usuariosTable = $("#usuariosTable").DataTable({
    destroy: true,
    autoWidth: false,
    columns: [
      { title: "ID" },
      { title: "Nombre" },
      { title: "Password" },
      { title: "Email" },
      { title: "Fecha Registro" },
      { title: "Rol" },
      { title: "Estado" },
      { title: "Acciones" },
    ],
  });

  cargarUsuarios(); // ✅ Llama la nueva función fetch
  // 🧼 Eliminar espacios extra en campos de usuario
  $("#nombreUsuario, #emailUsuario, #passwordUsuario").on("blur", function () {
    const limpio = $(this).val().trim();
    $(this).val(limpio);
  });
  $("#nombreUsuario, #emailUsuario, #passwordUsuario").on("input", function () {
    if (this.value.startsWith(" ")) {
      this.value = this.value.trimStart();
    }
  });
});

// 🟢 Cargar usuarios desde servidor Express

async function cargarUsuarios() {
  try {
    const [usuariosRes, historialRes] = await Promise.all([
      fetch("http://localhost:3000/api/usuarios"),
      fetch("http://localhost:3000/api/historial"), // 👈 Esta tabla SÍ existe
    ]);

    const usuarios = await usuariosRes.json();
    const historial = await historialRes.json();

    usuariosCache = usuarios;
    usuariosTable.clear();

    // 🔄 Mapea el historial por usuario_id para búsqueda rápida
    const historialMap = new Map();
    historial.forEach((registro) => {
      const userId = registro.usuario_id?.toString();
      const fechaActual = new Date(registro.fecha);
      if (!historialMap.has(userId) || historialMap.get(userId) < fechaActual) {
        historialMap.set(userId, fechaActual); // guarda la última actividad
      }
    });

    usuarios.forEach((usuario) => {
      const actividadFecha = historialMap.get(usuario._id.toString());
      const estado = generarEstadoHTML(actividadFecha);

      usuariosTable.row.add([
        usuario._id,
        usuario.nombre,
        "********",
        usuario.email,
        formatearFecha(usuario.fechaRegistro || new Date().toISOString()),
        usuario.rol,
        estado,
        accionesHTML(usuario._id),
      ]);
    });

    usuariosTable.draw();
  } catch (error) {
    console.error("❌ Error al cargar usuarios o historial:", error);
  }
}

function generarEstadoHTML(fechaUltimaConexion) {
  if (!fechaUltimaConexion) {
    return `🔴 Inactivo (sin actividad)`;
  }

  const fecha = new Date(fechaUltimaConexion);
  const ahora = new Date();
  const diferenciaDias = Math.floor((ahora - fecha) / (1000 * 60 * 60 * 24));

  if (diferenciaDias <= 7) {
    return `<span style="color:green; font-weight:bold;">🟢 Activo</span>`;
  } else {
    return `<span style="color:red;">🔴 Inactivo desde ${fecha.toLocaleDateString(
      "es-ES"
    )}</span>`;
  }
}

// 🟢 Generar HTML para editar y eliminar
function accionesHTML(id) {
  return `
    <button onclick="editarUsuario('${id}')">✏️ Editar</button>
    <button class="btn-eliminar" onclick="eliminarUsuario('${id}')">🗑️ Eliminar</button>
  `;
}

// 🟢 Mostrar formulario para agregar
function mostrarFormularioAgregar() {
  $("#formTitulo").text("Añadir Usuario");
  $("#usuarioID, #nombreUsuario, #emailUsuario, #passwordUsuario").val("");
  $("#rolUsuario").val("usuario");

  // ✅ Mostrar fecha actual en el campo de fecha (formato DD/MM/AAAA)
  const fechaActual = new Date();
  $("#fechaRegistroUsuario").val(
    fechaActual.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  );

  // ✅ Cambiar la función del botón Guardar para CREAR usuario
  $("#botonesFormulario button:first")
    .off("click")
    .on("click", guardarCambiosDesdeFormulario);

  $("#formularioUsuario").show();
  document
    .getElementById("formularioUsuario")
    .scrollIntoView({ behavior: "smooth" });
}

// 🟢 Guardar (crear)
async function guardarCambiosDesdeFormulario() {
  const id = $("#usuarioID").val();
  const nombre = $("#nombreUsuario").val();
  let password = $("#passwordUsuario").val();
  const email = $("#emailUsuario").val();
  const rol = $("#rolUsuario").val();

  // ✅ Validaciones
  if (validaciones.camposVacios(nombre, email, password)) {
    validaciones.mostrarAlertaError("Campos Vacíos", "⚠️ Todos los campos son obligatorios.");
    return;
  }

  if (!validaciones.esEmailValido(email)) {
    validaciones.mostrarAlertaError("Email inválido", "⚠️ El email no tiene un formato válido.");
    return;
  }

  if (!validaciones.esPasswordSegura(password)) {
    validaciones.mostrarAlertaError("⚠️ Contraseña débil", "La contraseña debe tener al menos 8 caracteres, un número y una letra minúscula.");
    return;
  }

  const usuario = {
    nombre,
    pass: password,
    email,
    rol,
    fechaRegistro: new Date().toISOString(), // Fecha actual de registro
  };

  console.log("📤 Enviando datos al backend:", usuario); // 🔍 Ver qué se envía

  try {
    let response;
    if (id) {
      // PUT = actualizar usuario
      response = await fetch(`http://localhost:3000/api/usuarios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(usuario),
      });
    } else {
      // POST = nuevo usuario
      response = await fetch("http://localhost:3000/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(usuario),
      });
    }

    if (!response.ok) throw new Error("Error al guardar usuario");

    const data = await response.json();
    console.log("✅ Respuesta del backend:", data); // 🔍 Ver respuesta del servidor

    if (!data.usuario) {
      console.error("❌ Error: El backend no devolvió el usuario creado.");
      return;
    }

    // ✅ Si el usuario fue creado, actualizar la tabla sin recargar la página
    if (!id) {
      usuariosTable.row
        .add([
          data.usuario._id,
          data.usuario.nombre,
          "********", // 🔹 No mostrar la contraseña real
          data.usuario.email,
          formatearFecha(data.usuario.fechaRegistro), // ✅ Ahora la fecha viene del backend
          data.usuario.rol,
          `<span>🔴 Inactivo (sin actividad)</span>`, // Estado por defecto
          accionesHTML(data.usuario._id),
        ])
        .draw();
    }

    cerrarFormulario();
  } catch (err) {
    console.error("❌ Error guardando usuario:", err);
  }
}

// 🟢 Guardar cambios en la edición de un usuario existente
// 🟢 Guardar cambios en la edición de un usuario existente
async function guardarEdicionUsuario() {
  const id = $("#usuarioID").val();
  if (!id) {
    console.error("❌ No hay un ID de usuario válido.");
    return;
  }

  const nombre = $("#nombreUsuario").val();
  const password = $("#passwordUsuario").val();
  const email = $("#emailUsuario").val();
  const rol = $("#rolUsuario").val();

  // ✅ Validar que todos los campos estén llenos
  if (validaciones.camposVacios(nombre, email, password)) {
    validaciones.mostrarAlertaError("Campos Vacíos", "⚠️ Todos los campos son obligatorios.");
    return;
  }

  // ✅ Validar que el email sea válido
  if (!validaciones.esEmailValido(email)) {
    validaciones.mostrarAlertaError("Email inválido", "⚠️ El email no tiene un formato válido.");
    return;
  }

  // ✅ Validar que la contraseña sea segura (mínimo 6 caracteres)
  if (!validaciones.esPasswordSegura(password)) {
    validaciones.mostrarAlertaError("Contraseña débil", "⚠️ La contraseña debe tener al menos 6 caracteres.");
    return;
  }

  // ✅ Solo enviar los campos que se han modificado
  const usuarioActualizado = {};
  if (nombre) usuarioActualizado.nombre = nombre;
  if (password) usuarioActualizado.pass = password;
  if (email) usuarioActualizado.email = email;
  if (rol) usuarioActualizado.rol = rol;

  console.log("📤 Enviando datos para editar usuario:", usuarioActualizado);

  try {
    const response = await fetch(`http://localhost:3000/api/usuarios/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(usuarioActualizado),
    });

    if (!response.ok) throw new Error("Error al actualizar usuario");

    console.log("✅ Usuario actualizado correctamente");

    await cargarUsuarios();
    cerrarFormulario();
  } catch (err) {
    console.error("❌ Error actualizando usuario:", err);
  }
}


// 🟢 Editar usuario
function editarUsuario(id) {
  const usuario = usuariosCache.find((u) => u._id === id);
  if (!usuario) return;

  $("#formTitulo").text("Editar Usuario");
  $("#usuarioID").val(usuario._id);
  $("#nombreUsuario").val(usuario.nombre || "");
  $("#emailUsuario").val(usuario.email || "");
  $("#passwordUsuario").val(usuario.password || ""); // 🔹val(""); No mostrar la contraseña real
  $("#rolUsuario").val(usuario.rol || "usuario");

  // ✅ Cambia la función del botón Guardar para edición
  $("#botonesFormulario button:first")
    .off("click")
    .on("click", guardarEdicionUsuario);

  $("#formularioUsuario").show();
  document
    .getElementById("formularioUsuario")
    .scrollIntoView({ behavior: "smooth" });
}

// 🟢 Eliminar usuario
async function eliminarUsuario(id) {
  const result = await Swal.fire({
    title: "¿Estás seguro?",
    text: "Esta acción no se puede deshacer",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
  });

  if (!result.isConfirmed) return;

  try {
    const response = await fetch(`http://localhost:3000/api/usuarios/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Error al eliminar usuario");

    await Swal.fire("Eliminado", "El usuario ha sido eliminado.", "success");

    await cargarUsuarios();
  } catch (err) {
    console.error("❌ Error eliminando usuario:", err);
    Swal.fire("Error", "No se pudo eliminar el usuario.", "error");
  }
}

function mostrarMensajeInicioSesion(usuarioNombre) {
  Swal.fire({
    title: "¡Bienvenido! 🎉",
    html: `
      <h3 style="color:#333">Inicio de sesión exitoso</h3>
      <p style="font-size:18px;">Hola, <b>${usuarioNombre}</b>, nos alegra verte de nuevo. 😊</p>
    `,
    icon: "success",
    confirmButtonText: "Ir al Panel",
    confirmButtonColor: "#3085d6",
    timer: 4000, // Se cierra en 4 segundos automáticamente
    timerProgressBar: true,
    backdrop: `
      rgba(0,0,0,0.7)
      url("https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.gif")
      center center
      no-repeat
    `,
  }).then(() => {
    window.location.href = "/src/intranet/html/intranet.html"; // Redirigir tras aceptar
  });
}

async function iniciarSesion() {
  const email = document.getElementById("emailUsuario").value;
  const password = document.getElementById("passwordUsuario").value;

  try {
    const response = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Error al iniciar sesión");
    }
    console.log("Datos recibidos del backend:", data);

    // ✅ Si el login es exitoso, mostramos SweetAlert2
    mostrarMensajeInicioSesion(data.nombre);
  } catch (error) {
    console.error("❌ Error al iniciar sesión:", error);
    Swal.fire({
      title: "Error",
      text: "Correo o contraseña incorrectos",
      icon: "error",
      confirmButtonText: "Intentar de nuevo",
    });
  }
}

// 🟢 Formatear fecha
function formatearFecha(fechaISO) {
  const fecha = new Date(fechaISO);
  if (isNaN(fecha.getTime())) return fechaISO; // Si es string no ISO, se devuelve tal cual
  return fecha.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// 🟢 Cerrar formulario
function cerrarFormulario() {
  $("#formularioUsuario").hide();
  $("#usuarioID, #nombreUsuario, #emailUsuario, #passwordUsuario").val("");
}

// Función para eliminar los espacios antes y después del texto en los campos de entrada
function eliminarEspacios(event) {
  let valor = event.target.value;
  // Elimina los espacios al principio y al final
  event.target.value = valor.replace(/^\s+|\s+$/, '');
}

// Añadir el evento a los campos de texto
document.addEventListener("DOMContentLoaded", function() {
  document.getElementById('nombreUsuario').addEventListener('input', eliminarEspacios);
  document.getElementById('passwordUsuario').addEventListener('input', eliminarEspacios);
  document.getElementById('emailUsuario').addEventListener('input', eliminarEspacios);
});

// 🟢 Exponer funciones globales
window.editarUsuario = editarUsuario;
window.eliminarUsuario = eliminarUsuario;
window.mostrarFormularioAgregar = mostrarFormularioAgregar;
window.guardarCambiosDesdeFormulario = guardarCambiosDesdeFormulario;
window.cerrarFormulario = cerrarFormulario;
window.cargarUsuarios = cargarUsuarios;
window, (mostrarMensajeInicioSesion = mostrarMensajeInicioSesion);
