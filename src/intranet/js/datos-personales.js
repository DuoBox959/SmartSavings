// 🔹 Variables globales
let datosPersonalesTable;
let datosPersonalesCache = [];

// 🔹 Iniciar DataTable y cargar datos cuando el documento esté listo
$(document).ready(() => {
  datosPersonalesTable = $("#datosPersonalesTable").DataTable({
    destroy: true,
    autoWidth: false,
    columns: [
      { title: "ID" },
      { title: "Nombre" },
      { title: "Apellidos" },
      { title: "Usuario ID" },
      { title: "Fecha Nacimiento" },
      { title: "Género" },
      { title: "Idioma" },
      { title: "Zona Horaria" },
      { title: "Notif. Correo" },
      { title: "Acciones" }
    ],
  });

  cargarDatosPersonales();
});

// 🟢 Cargar datos desde servidor Express
async function cargarDatosPersonales() {
  try {
    const respuesta = await fetch("http://localhost:3000/api/datos-personales");
    const datos = await respuesta.json();

    datosPersonalesCache = datos; // Actualizamos cache
    datosPersonalesTable.clear();

    datos.forEach((dato) => {
      datosPersonalesTable.row.add([
        dato._id || "N/A",
        dato.nombre || "",
        dato.apellidos || "",
        dato.usuario_id || "N/A",
        formatearFecha(dato.fechaNacimiento),
        dato.genero || "",
        dato.idioma || "",
        dato.zonaHoraria || "",
        dato.recibirNotificaciones ? "✅" : "❌",
        accionesHTML(dato._id),
      ]);
    });

    datosPersonalesTable.draw();
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
function mostrarFormularioAgregar() {
  $("#formTitulo").text("Añadir Datos Personales");
  $("#datoID, #nombre, #apellidos, #usuarioId, #fechaNacimiento, #genero, #idioma, #zonaHoraria").val("");
  $("#notificaciones").prop("checked", false);

  $("#botonesFormulario button:first")
    .off("click")
    .on("click", guardarDato);

  $("#formularioDatos").show();
  document
    .getElementById("formularioDatos")
    .scrollIntoView({ behavior: "smooth" });
}

// 🟢 Editar dato personal
function editarDato(id) {
  const dato = datosPersonalesCache.find((d) => d._id === id);
  if (!dato) return;

  $("#formTitulo").text("Editar Datos Personales");
  $("#datoID").val(dato._id);
  $("#nombre").val(dato.nombre || "");
  $("#apellidos").val(dato.apellidos || "");
  $("#usuarioId").val(dato.usuario_id || "");
  $("#fechaNacimiento").val(dato.fechaNacimiento?.split("T")[0] || "");
  $("#genero").val(dato.genero || "");
  $("#idioma").val(dato.idioma || "");
  $("#zonaHoraria").val(dato.zonaHoraria || "");
  $("#notificaciones").prop("checked", dato.recibirNotificaciones || false);

  $("#botonesFormulario button:first")
    .off("click")
    .on("click", guardarDato);

  $("#formularioDatos").show();
  document
    .getElementById("formularioDatos")
    .scrollIntoView({ behavior: "smooth" });
}

// 🟢 Guardar (crear o editar)
async function guardarDato() {
  const id = $("#datoID").val();
  const body = {
    nombre: $("#nombre").val().trim(),
    apellidos: $("#apellidos").val().trim(),
    usuario_id: $("#usuarioId").val().trim(),
    fechaNacimiento: $("#fechaNacimiento").val(),
    genero: $("#genero").val(),
    idioma: $("#idioma").val(),
    zonaHoraria: $("#zonaHoraria").val(),
    recibirNotificaciones: $("#notificaciones").is(":checked")
  };

  if (!body.nombre || !body.usuario_id) {
    alert("⚠️ El nombre y el ID de usuario son obligatorios.");
    return;
  }

  try {
    let response;
    if (id) {
      // PUT (editar)
      response = await fetch(`http://localhost:3000/api/datos-personales/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      // POST (crear)
      response = await fetch("http://localhost:3000/api/datos-personales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    if (!response.ok) throw new Error("Error al guardar");

    Swal.fire("✅ Guardado", "Los datos han sido guardados.", "success");
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
    cancelButtonText: "Cancelar"
  });

  if (!confirmacion.isConfirmed) return;

  try {
    const response = await fetch(`http://localhost:3000/api/datos-personales/${id}`, {
      method: "DELETE",
    });

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

// 🟢 Cerrar formulario
function cerrarFormulario() {
  $("#formularioDatos").hide();
  $("#datoID, #nombre, #apellidos, #usuarioId, #fechaNacimiento, #genero, #idioma, #zonaHoraria").val("");
  $("#notificaciones").prop("checked", false);
}

// 🟢 Exponer funciones globales
window.editarDato = editarDato;
window.eliminarDato = eliminarDato;
window.mostrarFormularioAgregar = mostrarFormularioAgregar;
window.guardarDato = guardarDato;
window.cerrarFormulario = cerrarFormulario;
window.cargarDatosPersonales = cargarDatosPersonales;
