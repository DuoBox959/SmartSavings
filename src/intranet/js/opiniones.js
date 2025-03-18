// ✅ Variables Globales
let opinionesTable;
let opinionesCache = [];

// ✅ Iniciar DataTable y cargar opiniones cuando el documento esté listo
$(document).ready(() => {
  opinionesTable = $("#opinionesTable").DataTable({
    destroy: true,
    autoWidth: false,
    columns: [
      { title: "ID" },
      { title: "Producto ID" },
      { title: "Usuario ID" },
      { title: "Opinión" },
      { title: "Calificación" },
      { title: "Fecha" },
      { title: "Acciones" },
    ],
  });

  cargarOpiniones();
});

// ✅ Cargar opiniones desde el servidor
async function cargarOpiniones() {
  try {
    const respuesta = await fetch("http://localhost:3000/api/opiniones");
    const opiniones = await respuesta.json();

    opinionesCache = opiniones; // Guardamos en caché para editar/eliminar

    opinionesTable.clear(); // Limpiar la tabla antes de actualizar

    opiniones.forEach((opinion) => {
      opinionesTable.row.add([
        opinion._id || "N/A",
        opinion.Producto_id || "N/A",
        opinion.Usuario_id || "N/A",
        opinion.Opinion || "N/A",
        opinion.Calificacion || "N/A",
        new Date(opinion.Fecha).toLocaleDateString(), // Convertir fecha
        accionesHTML(opinion._id), // Generar botones de acciones
      ]);
    });

    opinionesTable.draw();
  } catch (error) {
    console.error("❌ Error al cargar opiniones:", error);
  }
}

// ✅ Función para generar botones de acciones
function accionesHTML(id) {
  return `
    <button onclick="editarOpinion('${id}')">✏️ Editar</button>
    <button class="btn-eliminar" onclick="eliminarOpinion('${id}')">🗑️ Eliminar</button>
  `;
}

// ✅ Mostrar formulario para agregar una opinión
function mostrarFormularioAgregar() {
  $("#formTitulo").text("Añadir Opinión");
  $("#opinionID, #productoID, #usuarioID, #textoOpinion, #calificacionOpinion").val("");

  $("#botonesFormulario button:first")
    .off("click")
    .on("click", guardarOpinion);

  $("#formularioOpinion").show();
}

// ✅ Guardar una opinión (crear o editar)
async function guardarOpinion() {
  const id = $("#opinionID").val();
  const producto_id = $("#productoID").val().trim();
  const usuario_id = $("#usuarioID").val().trim();
  const opinionTexto = $("#textoOpinion").val().trim();
  const calificacion = $("#calificacionOpinion").val().trim();

  // 📌 Validar los campos obligatorios
  if (!producto_id || !usuario_id || !opinionTexto) {
    alert("⚠️ Producto ID, Usuario ID y Opinión son obligatorios.");
    return;
  }

  const opinion = {
    Producto_id: producto_id, // Se enviará como string, pero el backend lo convertirá en ObjectId
    Usuario_id: usuario_id,
    Opinion: opinionTexto,
    Calificacion: calificacion ? parseInt(calificacion, 10) : null,
  };

  try {
    let response;
    if (id) {
      // Actualizar opinión
      response = await fetch(`http://localhost:3000/api/opiniones/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(opinion),
      });
    } else {
      // Crear nueva opinión
      response = await fetch("http://localhost:3000/api/opiniones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(opinion),
      });
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error al guardar opinión");
    }

    await cargarOpiniones();
    cerrarFormulario();
  } catch (err) {
    console.error("❌ Error guardando opinión:", err);
    alert(`❌ Error: ${err.message}`);
  }
}

// ✅ Editar una opinión
function editarOpinion(id) {
  const opinion = opinionesCache.find((o) => o._id === id);
  if (!opinion) return;

  $("#formTitulo").text("Editar Opinión");
  $("#opinionID").val(opinion._id);
  $("#productoID").val(opinion.Producto_id);
  $("#usuarioID").val(opinion.Usuario_id);
  $("#textoOpinion").val(opinion.Opinion);
  $("#calificacionOpinion").val(opinion.Calificacion);

  $("#botonesFormulario button:first")
    .off("click")
    .on("click", guardarOpinion);

  $("#formularioOpinion").show();
}

// ✅ Eliminar una opinión
async function eliminarOpinion(id) {
  const confirmacion = confirm("¿Estás seguro de eliminar esta opinión?");
  if (!confirmacion) return;

  try {
    const response = await fetch(`http://localhost:3000/api/opiniones/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Error al eliminar opinión");

    await cargarOpiniones();
  } catch (err) {
    console.error("❌ Error eliminando opinión:", err);
  }
}

// 🟢 Volver atrás
function volverAtras() {
  window.location.href = "../html/intranet.html";
}

// ✅ Cerrar el formulario de opinión
function cerrarFormulario() {
  $("#formularioOpinion").hide();
  $("#opinionID, #productoID, #usuarioID, #textoOpinion, #calificacionOpinion").val("");
}

// ✅ Exponer funciones globales para que sean accesibles en el HTML
window.mostrarFormularioAgregar = mostrarFormularioAgregar;
window.cerrarFormulario = cerrarFormulario;
window.editarOpinion = editarOpinion;
window.eliminarOpinion = eliminarOpinion;
window.cargarOpiniones = cargarOpiniones;
window.volverAtras = volverAtras;

