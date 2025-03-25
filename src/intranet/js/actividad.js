// 🔹 Variables globales
let actividadTable;
let historialCache = [];

// 🔹 Iniciar DataTable cuando el documento esté listo
$(document).ready(() => {
  actividadTable = $("#actividadTable").DataTable({
    destroy: true,
    autoWidth: false,
    columns: [
      { title: "ID" },
      { title: "Usuario ID" },
      { title: "Acción" },
      { title: "Fecha" },
      { title: "Activo Últimos 7 días" },
      { title: "Acciones" },
    ],
  });

  cargarHistorial();
});

// 🟢 Cargar historial desde el servidor
async function cargarHistorial() {
  try {
    const response = await fetch("http://localhost:3000/api/historial");
    const historial = await response.json();

    historialCache = historial;
    actividadTable.clear();

    const ahora = new Date();

    historial.forEach(item => {
      const fechaActividad = new Date(item.fecha);
      const diferenciaDias = Math.floor((ahora - fechaActividad) / (1000 * 60 * 60 * 24));

      const activo7d = diferenciaDias <= 7 ? "✅ Sí" : "❌ No";

      actividadTable.row.add([
        item._id,
        item.usuario_id,
        item.accion,
        formatearFechaHora(item.fecha),
        activo7d,
        accionesHTML(item._id)
      ]);
    });

    actividadTable.draw();
  } catch (err) {
    console.error("❌ Error al cargar historial:", err);
  }
}

// 🟢 Generar HTML para editar y eliminar
function accionesHTML(id) {
  return `
    <button onclick="editarActividad('${id}')">✏️ Editar</button>
    <button class="btn-eliminar" onclick="eliminarActividad('${id}')">🗑️ Eliminar</button>
  `;
}

// 🟢 Mostrar formulario para crear nuevo registro
function mostrarFormularioAgregar() {
  $("#formTitulo").text("Registrar Actividad");
  $("#actividadID, #usuarioId, #accion, #fechaActividad").val("");

  const ahora = new Date();
  $("#fechaActividad").val(ahora.toISOString().slice(0, 16)); // formato yyyy-MM-ddTHH:mm

  $("#botonesFormulario button:first")
    .off("click")
    .on("click", guardarCambiosDesdeFormulario);

  $("#formularioActividad").show();
  document.getElementById("formularioActividad").scrollIntoView({ behavior: "smooth" });
}

// 🟢 Guardar (crear o editar)
async function guardarCambiosDesdeFormulario() {
  const id = $("#actividadID").val();
  const actividad = {
    usuario_id: $("#usuarioId").val(),
    accion: $("#accion").val(),
    fecha: $("#fechaActividad").val() ? new Date($("#fechaActividad").val()).toISOString() : new Date().toISOString()
  };

  if (!actividad.usuario_id || !actividad.accion) {
    alert("⚠️ Usuario ID y Acción son obligatorios.");
    return;
  }

  try {
    let response;
    if (id) {
      // PUT
      response = await fetch(`http://localhost:3000/api/historial/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(actividad),
      });
    } else {
      // POST
      response = await fetch("http://localhost:3000/api/historial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(actividad),
      });
    }

    if (!response.ok) throw new Error("Error al guardar actividad");

    Swal.fire("✅ Guardado", "Actividad registrada correctamente", "success");
    await cargarHistorial();
    cerrarFormulario();
  } catch (err) {
    console.error("❌ Error guardando actividad:", err);
    Swal.fire("Error", "No se pudo guardar la actividad", "error");
  }
}

// 🟢 Editar registro
function editarActividad(id) {
  const actividad = historialCache.find((a) => a._id === id);
  if (!actividad) return;

  $("#formTitulo").text("Editar Actividad");
  $("#actividadID").val(actividad._id);
  $("#usuarioId").val(actividad.usuario_id);
  $("#accion").val(actividad.accion);
  $("#fechaActividad").val(new Date(actividad.fecha).toISOString().slice(0, 16));

  $("#botonesFormulario button:first")
    .off("click")
    .on("click", guardarCambiosDesdeFormulario);

  $("#formularioActividad").show();
  document.getElementById("formularioActividad").scrollIntoView({ behavior: "smooth" });
}

// 🟢 Eliminar actividad
async function eliminarActividad(id) {
  const confirmacion = await Swal.fire({
    title: "¿Estás seguro?",
    text: "Esto eliminará el registro de actividad.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar"
  });

  if (!confirmacion.isConfirmed) return;

  try {
    const response = await fetch(`http://localhost:3000/api/historial/${id}`, {
      method: "DELETE"
    });

    if (!response.ok) throw new Error("Error al eliminar");

    Swal.fire("✅ Eliminado", "La actividad fue eliminada", "success");
    await cargarHistorial();
  } catch (err) {
    console.error("❌ Error eliminando actividad:", err);
    Swal.fire("Error", "No se pudo eliminar la actividad", "error");
  }
}

// 🟢 Formatear fecha y hora
function formatearFechaHora(fechaISO) {
  if (!fechaISO) return "N/A";
  const fecha = new Date(fechaISO);
  if (isNaN(fecha.getTime())) return fechaISO;

  return fecha.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

// 🟢 Cerrar formulario
function cerrarFormulario() {
  $("#formularioActividad").hide();
  $("#actividadID, #usuarioId, #accion, #fechaActividad").val("");
}

// 🟢 Exponer funciones globales
window.mostrarFormularioAgregar = mostrarFormularioAgregar;
window.guardarCambiosDesdeFormulario = guardarCambiosDesdeFormulario;
window.editarActividad = editarActividad;
window.eliminarActividad = eliminarActividad;
window.cerrarFormulario = cerrarFormulario;
window.cargarHistorial = cargarHistorial;
