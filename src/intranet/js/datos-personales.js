let tablaDatosPersonales;

$(document).ready(() => {
  tablaDatosPersonales = $("#datosPersonalesTable").DataTable({
    destroy: true,
    autoWidth: false,
    columns: [
      { title: "ID" },
      { title: "Usuario ID" },
      { title: "Nombre" },
      { title: "Apellidos" },
      { title: "Fecha Nac." },
      { title: "Género" },
      { title: "Idioma" },
      { title: "Zona Horaria" },
      { title: "Notif. Email" },
    ],
  });

  cargarDatosPersonales();
});

// 🔄 Cargar datos personales desde API
async function cargarDatosPersonales() {
  try {
    const response = await fetch("http://localhost:3000/api/datos-personales");
    const datos = await response.json();

    tablaDatosPersonales.clear();

    datos.forEach((dato) => {
      tablaDatosPersonales.row.add([
        dato._id || "N/A",
        dato.usuario_id || "N/A",
        dato.nombre || "",
        dato.apellidos || "",
        formatearFecha(dato.fechaNacimiento),
        dato.genero || "N/A",
        dato.idioma || "N/A",
        dato.zonaHoraria || "N/A",
        dato.recibirNotificaciones ? "✅" : "❌",
      ]);
    });

    tablaDatosPersonales.draw();
  } catch (err) {
    console.error("❌ Error cargando datos personales:", err);
    Swal.fire("Error", "No se pudieron cargar los datos personales", "error");
  }
}

// 🔧 Formatear fechas a formato corto
function formatearFecha(fechaISO) {
  if (!fechaISO) return "N/A";
  const fecha = new Date(fechaISO);
  if (isNaN(fecha)) return fechaISO;
  return fecha.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
