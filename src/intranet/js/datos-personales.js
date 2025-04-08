import * as validaciones from "../../valid/validaciones.js";

// 🔹 Variables globales
let datosPersonalesTable;
let datosPersonalesCache = [];
let usuariosCache = [];
// 🔹 Iniciar DataTable y cargar datos cuando el documento esté listo
$(document).ready(() => {
  datosPersonalesTable = $("#datosPersonalesTable").DataTable({
    destroy: true,
    autoWidth: false,
    columns: [
      { title: "ID" },
      { title: "Nombre" },
      { title: "Apellidos" },
      { title: "Usuario" },
      { title: "Fecha Nacimiento" },
      { title: "Género" },
      { title: "Idioma" },
      { title: "Zona Horaria" },
      { title: "Notif. Correo" },
      { title: "Acciones" },
    ],
  });
  cargarUsuariosEnSelect();
  cargarDatosPersonales();

  // 🧼 Quitar espacios al salir del input
  $("#nombre, #apellidos, #idioma, #zonaHoraria").on("blur", function () {
    const limpio = $(this).val().trim();
    $(this).val(limpio);
  });

  // 🚫 BONUS: evitar escribir espacios al inicio
  $("#nombre, #apellidos, #idioma, #zonaHoraria").on("input", function () {
    if (this.value.startsWith(" ")) {
      this.value = this.value.trimStart();
    }
  });
});
function obtenerNombreUsuario(usuarioId) {
  const usuario = usuariosCache.find((u) => u._id === usuarioId);
  console.log("👤 Buscando usuario:", usuarioId, "=>", usuario?.nombre);

  return usuario ? usuario.nombre : "Desconocido";
}

// 🟢 Cargar datos desde servidor Express
async function cargarDatosPersonales() {
  try {
    const respuesta = await fetch("http://localhost:3000/api/datos-personales");
    const datos = await respuesta.json();

    datosPersonalesCache = datos; // 👈 Cache para editar
    datosPersonalesTable.clear().draw(); // Limpia completamente la tabla

    datos.forEach((dato) => {
      datosPersonalesTable.row.add([
        dato._id || "N/A",
        dato.nombre || "",
        dato.apellidos || "",
        obtenerNombreUsuario(dato.usuario_id) || "Desconocido",
        formatearFecha(dato.fechaNacimiento),
        dato.genero || "",
        dato.idioma || "",
        dato.zonaHoraria || "",
        dato.recibirNotificaciones ? "✅" : "❌",
        accionesHTML(dato._id), // Botones de acción
      ]);
    });

    datosPersonalesTable.draw(); // 🔁 Redibuja todo
  } catch (error) {
    console.error("❌ Error al cargar datos personales:", error);
  }
}

// 🟢 Generar HTML para editar y eliminar
function accionesHTML(id) {
  return `
    <button onclick="editarDato('${id}')">✏️ Editar</button>
    <button class="btn-eliminar" onclick="eliminarDato('${id}')">🗑️ Eliminar</button>
  `;
}

// 🟢 Mostrar formulario para agregar
async function mostrarFormularioAgregar() {
  $("#formTitulo").text("Añadir Datos Personales");
  $(
    "#datoID, #nombre, #apellidos, #usuarioId, #fechaNacimiento, #genero, #idioma, #zonaHoraria"
  ).val("");
  $("#notificaciones").prop("checked", false);

  await cargarUsuariosEnSelect(); // 💥 Aquí

  $("#botonesFormulario button:first").off("click").on("click", guardarDato);

  $("#formularioDatos").show();
  document
    .getElementById("formularioDatos")
    .scrollIntoView({ behavior: "smooth" });
}

// 🟢 Editar dato personal
async function editarDato(id) {
  const dato = datosPersonalesCache.find((d) => d._id === id);
  if (!dato) return;

  $("#formTitulo").text("Editar Datos Personales");
  $("#datoID").val(dato._id);
  $("#nombre").val(dato.nombre || "");
  $("#apellidos").val(dato.apellidos || "");
  $("#fechaNacimiento").val(dato.fechaNacimiento?.split("T")[0] || "");
  $("#genero").val(dato.genero || "");
  $("#idioma").val(dato.idioma || "");
  $("#zonaHoraria").val(dato.zonaHoraria || "");
  $("#notificaciones").prop("checked", dato.recibirNotificaciones || false);

  await cargarUsuariosEnSelect(); // 💥 Aquí
  $("#usuarioId").val(dato.usuario_id || ""); // 👈 Seleccionar el correcto

  $("#botonesFormulario button:first").off("click").on("click", guardarDato);

  $("#formularioDatos").show();
  document
    .getElementById("formularioDatos")
    .scrollIntoView({ behavior: "smooth" });
}

// 🟢 Guardar (crear o editar)
async function guardarDato() {
  const id = $("#datoID").val();
  const body = {
    nombre: validaciones.limpiarEspacios($("#nombre").val()),
    apellidos: validaciones.limpiarEspacios($("#apellidos").val()),
    usuario_id: $("#usuarioId").val().trim(),
    fechaNacimiento: $("#fechaNacimiento").val(),
    genero: $("#genero").val(),
    idioma: validaciones.limpiarEspacios($("#idioma").val()),
    zonaHoraria: validaciones.limpiarEspacios($("#zonaHoraria").val()),
    recibirNotificaciones: $("#notificaciones").is(":checked"),
  };

  // 🛑 Validaciones
  if (validaciones.camposVacios(body.nombre, body.usuario_id, body.idioma, body.zonaHoraria)) {
    return validaciones.mostrarAlertaError("Campos obligatorios", "Por favor, completa todos los campos requeridos.");
  }

  if (!validaciones.esTextoValido(body.nombre) || !validaciones.esTextoValido(body.apellidos)) {
    return validaciones.mostrarAlertaError("Nombre/Apellidos inválidos", "Asegúrate de ingresar texto válido.");
  }

  if (isNaN(Date.parse(body.fechaNacimiento))) {
    return validaciones.mostrarAlertaError("Fecha inválida", "Ingrese una fecha de nacimiento válida.");
  }

  if (!["Masculino", "Femenino", "Otro"].includes(body.genero)) {
    return validaciones.mostrarAlertaError("Género inválido", "Seleccione un género válido.");
  }

  if (!/^[A-Za-zÁÉÍÓÚáéíóúüÜñÑ\s]+$/.test(body.idioma)) {
    return validaciones.mostrarAlertaError("Idioma inválido", "El idioma solo puede contener letras y espacios.");
  }

  if (!/^UTC([+-]\d{1,2})$/.test(body.zonaHoraria)) {
    return validaciones.mostrarAlertaError("Zona horaria inválida", "Formato correcto: UTC-5, UTC+1, etc.");
  }

  try {
    let response;
    if (id) {
      response = await fetch(`http://localhost:3000/api/datos-personales/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      response = await fetch("http://localhost:3000/api/datos-personales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    if (!response.ok) throw new Error("Error al guardar");

    Swal.fire("✅ Éxito", id ? "Datos actualizados correctamente" : "Datos añadidos correctamente", "success");

    $("#datoID").val("");
    await cargarDatosPersonales();
    cerrarFormulario();
  } catch (err) {
    console.error("❌ Error guardando datos:", err);
    Swal.fire("Error", "No se pudieron guardar los datos", "error");
  }
}

// 🟢 Eliminar dato personal
async function eliminarDato(id) {
  const confirmacion = await Swal.fire({
    title: "¿Estás seguro?",
    text: "Esto eliminará los datos personales.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
  });

  if (!confirmacion.isConfirmed) return;

  try {
    const response = await fetch(
      `http://localhost:3000/api/datos-personales/${id}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) throw new Error("Error al eliminar");

    Swal.fire("Eliminado", "Los datos fueron eliminados.", "success");
    await cargarDatosPersonales();
  } catch (err) {
    console.error("❌ Error eliminando datos:", err);
    Swal.fire("Error", "No se pudieron eliminar los datos", "error");
  }
}

// 🟢 Formatear fecha
function formatearFecha(fechaISO) {
  if (!fechaISO) return "N/A";
  const fecha = new Date(fechaISO);
  if (isNaN(fecha.getTime())) return fechaISO;
  return fecha.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
async function cargarUsuariosEnSelect() {
  try {
    const res = await fetch("http://localhost:3000/api/usuarios");
    const usuarios = await res.json();

    usuariosCache = usuarios; // Reutilizamos para mostrar nombre en la tabla

    const select = document.getElementById("usuarioId");
    select.innerHTML = '<option value="">Selecciona un usuario</option>';

    usuarios.forEach((u) => {
      const option = document.createElement("option");
      option.value = u._id;
      option.textContent = u.nombre;
      select.appendChild(option);
    });
  } catch (err) {
    console.error("❌ Error cargando usuarios:", err);
  }
}

// 🟢 Cerrar formulario
function cerrarFormulario() {
  $("#formularioDatos").hide();
  $(
    "#datoID, #nombre, #apellidos, #usuarioId, #fechaNacimiento, #genero, #idioma, #zonaHoraria"
  ).val("");
  $("#notificaciones").prop("checked", false);
}

 // Función para eliminar los espacios antes del texto en los campos de entrada
 function eliminarEspaciosPrincipio(event) {
  let valor = event.target.value;
  // Eliminar los espacios solo al principio
  event.target.value = valor.replace(/^\s+/, '');
}

// Añadir el evento a los campos de texto
document.addEventListener("DOMContentLoaded", function() {
  document.getElementById('nombre').addEventListener('input', eliminarEspaciosPrincipio);
  document.getElementById('apellidos').addEventListener('input', eliminarEspaciosPrincipio);
  document.getElementById('idioma').addEventListener('input', eliminarEspaciosPrincipio);
  document.getElementById('zonaHoraria').addEventListener('input', eliminarEspaciosPrincipio);
});

// 🟢 Exponer funciones globales
window.editarDato = editarDato;
window.eliminarDato = eliminarDato;
window.mostrarFormularioAgregar = mostrarFormularioAgregar;
window.guardarDato = guardarDato;
window.cerrarFormulario = cerrarFormulario;
window.cargarDatosPersonales = cargarDatosPersonales;
