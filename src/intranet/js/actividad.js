$(document).ready(() => {
  inicializarTabla();
  registrarAccion("Entró al historial de actividad");
  cargarHistorialUsuario();
});

function inicializarTabla() {
  $("#actividadTable").DataTable({
    destroy: true,
    autoWidth: false,
    columns: [
      { title: "Fecha" },
      { title: "Acción" },
      { title: "Usuario" }
    ],
    language: {
      url: "//cdn.datatables.net/plug-ins/1.13.4/i18n/es-ES.json"
    }
  });
}

async function cargarHistorialUsuario() {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  if (!usuario || !usuario._id) {
    Swal.fire("Error", "No se encontró el usuario en sesión", "error");
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/api/historial/${usuario._id}`);
    const historial = await response.json();

    const table = $("#actividadTable").DataTable();
    table.clear();

    historial.forEach(item => {
      table.row.add([
        formatearFecha(item.fecha),
        item.accion || "Sin acción",
        item.usuario || "Desconocido"
      ]);
    });

    table.draw();
  } catch (err) {
    console.error("❌ Error al cargar historial:", err);
    Swal.fire("Error", "No se pudo cargar el historial", "error");
  }
}

async function registrarAccion(accionTexto) {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  if (!usuario || !usuario._id) return;

  try {
    await fetch("http://localhost:3000/api/historial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usuario_id: usuario._id,
        accion: accionTexto
      })
    });
  } catch (err) {
    console.error("❌ Error registrando actividad:", err);
  }
}

function formatearFecha(fechaISO) {
  if (!fechaISO) return "N/A";
  const fecha = new Date(fechaISO);
  return fecha.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
