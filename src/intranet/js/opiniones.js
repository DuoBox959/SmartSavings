// ✅ Variables Globales
let opinionesTable;
let opinionesCache = [];
let productosCache = [];
let usuariosCache = [];

// ✅ Iniciar DataTable y cargar opiniones cuando el documento esté listo
$(document).ready(() => {
  opinionesTable = $("#opinionesTable").DataTable({
    destroy: true,
    autoWidth: false,
    columns: [
      { title: "ID" },
      { title: "Producto" },
      { title: "Usuario" },
      { title: "Opinión" },
      { title: "Calificación" },
      { title: "Fecha" },
      { title: "Acciones" },
    ],
  });

  cargarDatosIniciales();
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
        opinion.Producto_nombre || "N/A",
        opinion.Usuario_nombre || "N/A",
        `<button class="btn-opinion" onclick="verOpinion('${opinion._id}')">Ver Opinión</button>`,
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

// ✅ Cargar productos, usuarios y opiniones
async function cargarDatosIniciales() {
  try {
    const [productos, usuarios, opiniones] = await Promise.all([
      fetch("http://localhost:3000/api/productos").then((res) => res.json()),
      fetch("http://localhost:3000/api/usuarios").then((res) => res.json()),
      fetch("http://localhost:3000/api/opiniones").then((res) => res.json()),
    ]);

    productosCache = productos;
    usuariosCache = usuarios;
    opinionesCache = opiniones;

    llenarSelect("#productoID", productos);
    llenarSelect("#usuarioID", usuarios);

    actualizarTablaOpiniones();
  } catch (error) {
    console.error("❌ Error al cargar datos iniciales:", error);
  }
}

// ✅ Actualizar la tabla con nombres en lugar de IDs
function actualizarTablaOpiniones() {
  opinionesTable.clear();
  opinionesCache.forEach((opinion) => {
    const productoNombre = obtenerNombre(opinion.Producto_id, productosCache);
    const usuarioNombre = obtenerNombre(opinion.Usuario_id, usuariosCache);

    opinionesTable.row.add([
      opinion._id || "N/A",
      productoNombre || "N/A",
      usuarioNombre || "N/A",
      `<button class="btn-opinion" onclick="verOpinion('${opinion._id}')">Ver Opinión</button>`,
      opinion.Calificacion || "N/A",
      new Date(opinion.Fecha).toLocaleDateString(),
      accionesHTML(opinion._id),
    ]);
  });
  opinionesTable.draw();
}

// ✅ Función auxiliar para obtener nombres
function obtenerNombre(id, lista) {
  const item = lista.find((el) => el._id === id);
  return item ? item.Nombre || item.nombre : "Desconocido";
}

// ✅ Llenar selects con nombres en lugar de IDs
function llenarSelect(selector, datos) {
  const select = document.querySelector(selector);
  select.innerHTML = '<option value="">Seleccione una opción</option>';
  datos.forEach((item) => {
    select.innerHTML += `<option value="${item._id}">${
      item.Nombre || item.nombre
    }</option>`;
  });
}

// ✅ Mostrar la opinión en un modal
function verOpinion(id) {
  const opinion = opinionesCache.find((o) => o._id === id);
  if (!opinion) return;

  Swal.fire({
    title: "Opinión del Usuario",
    text: opinion.Opinion,
    icon: "info",
    confirmButtonText: "Aceptar",
    width: "50%",
  });
}

// ✅ Generar botones de acciones
function accionesHTML(id) {
  return `
    <button onclick="editarOpinion('${id}')">✏️ Editar</button>
    <button class="btn-eliminar" onclick="eliminarOpinion('${id}')">🗑️ Eliminar</button>
  `;
}

// ✅ Mostrar formulario para agregar una opinión
async function mostrarFormularioAgregar() {
  $("#formTitulo").text("Añadir Opinión");
  $(
    "#opinionID, #productoID, #usuarioID, #textoOpinion, #calificacionOpinion"
  ).val("");

  const fechaActual = new Date().toISOString().split("T")[0];
  $("#fechaOpinion").val(fechaActual).prop("disabled", false);

  $("#botonesFormulario button:first").off("click").on("click", guardarOpinion);

  $("#formularioOpinion").show();
  document
    .getElementById("formularioOpinion")
    .scrollIntoView({ behavior: "smooth" });
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
  $("#fechaOpinion").val(opinion.Fecha.split("T")[0]);
  $("#fechaOpinion").prop("disabled", true);

  $("#botonesFormulario button:first").off("click").on("click", guardarOpinion);

  $("#formularioOpinion").show();
  document
    .getElementById("formularioOpinion")
    .scrollIntoView({ behavior: "smooth" });
}

// ✅ Guardar una opinión (crear o editar)
async function guardarOpinion() {
  const id = $("#opinionID").val();
  const producto_id = $("#productoID").val().trim();
  const usuario_id = $("#usuarioID").val().trim();
  const opinionTexto = $("#textoOpinion").val().trim();
  const calificacion = $("#calificacionOpinion").val().trim();

  if (!producto_id || !usuario_id || !opinionTexto) {
    alert("⚠️ Producto, Usuario y Opinión son obligatorios.");
    return;
  }

  const opinion = {
    Producto_id: producto_id,
    Usuario_id: usuario_id,
    Opinion: opinionTexto,
    Calificacion: calificacion ? parseInt(calificacion, 10) : null,
  };

  try {
    let response;
    if (id) {
      response = await fetch(`http://localhost:3000/api/opiniones/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(opinion),
      });
    } else {
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

    await cargarDatosIniciales();
    cerrarFormulario();
  } catch (err) {
    console.error("❌ Error guardando opinión:", err);
    alert(`❌ Error: ${err.message}`);
  }
}

// ✅ Cerrar el formulario
function cerrarFormulario() {
  $("#formularioOpinion").hide();
  $(
    "#opinionID, #productoID, #usuarioID, #textoOpinion, #calificacionOpinion"
  ).val("");
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

    // 🟢 Eliminar la fila directamente del DataTable
    opinionesTable.rows().every(function () {
      const rowData = this.data();
      if (rowData[0] === id) {
        this.remove();
      }
    });

    opinionesTable.draw(); // Refrescar la tabla sin recargar todo

    // 🟢 También actualizar el cache eliminando la opinión eliminada
    opinionesCache = opinionesCache.filter((opinion) => opinion._id !== id);
  } catch (err) {
    console.error("❌ Error eliminando opinión:", err);
  }
}

// ✅ Exponer funciones globales
window.mostrarFormularioAgregar = mostrarFormularioAgregar;
window.cerrarFormulario = cerrarFormulario;
window.editarOpinion = editarOpinion;
window.eliminarOpinion = eliminarOpinion;
window.verOpinion = verOpinion;
window.cargarDatosIniciales = cargarDatosIniciales;
