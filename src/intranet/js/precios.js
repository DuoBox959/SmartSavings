// 🔹 Variables globales
let preciosTable;
let preciosCache = [];

// 🔹 Iniciar DataTable y cargar precios cuando el documento esté listo
$(document).ready(() => {
  preciosTable = $("#preciosTable").DataTable({
    destroy: true,
    autoWidth: false,
    columns: [
      { title: "ID" },
      { title: "Producto ID" },
      { title: "Precio Actual" },
      { title: "Precio Descuento" },
      { title: "Unidad/Lote" },
      { title: "Precio Histórico" },
      { title: "Acciones" },
    ],
  });

  cargarPrecios();
});

// 🟢 Cargar precios desde servidor Express
async function cargarPrecios() {
  try {
    const respuesta = await fetch("http://localhost:3000/api/precios");
    const precios = await respuesta.json();

    preciosCache = precios;
    preciosTable.clear();

    precios.forEach((precio) => {
      preciosTable.row.add([
        precio._id || "N/A",
        precio.producto_id || "N/A",
        typeof precio.precioActual === "number" 
          ? precio.precioActual.toFixed(2) + " €" 
          : "N/A",
        typeof precio.precioDescuento === "number"
          ? precio.precioDescuento.toFixed(2) + " €" 
          : "N/A",
        precio.unidadLote || "N/A",
        precio.precioHistorico && Array.isArray(precio.precioHistorico)
          ? precio.precioHistorico.map(p => (typeof p === "number" ? p.toFixed(2) : "N/A")).join(", ") + " €"
          : "N/A",
        accionesHTML(precio._id),
      ]);
    });

    preciosTable.draw();
  } catch (error) {
    console.error("❌ Error al cargar precios:", error);
  }
}


// 🟢 Generar HTML para editar y eliminar
function accionesHTML(id) {
  return `
    <button onclick="editarPrecio('${id}')">✏️ Editar</button>
    <button class="btn-eliminar" onclick="eliminarPrecio('${id}')">🗑️ Eliminar</button>
  `;
}

// 🟢 Mostrar formulario para agregar
function mostrarFormularioAgregar() {
  $("#formTitulo").text("Añadir Precio");
  $("#precioID, #productoID, #precioActual, #precioDescuento, #unidadLote, #precioHistorico").val("");

  $("#botonesFormulario button:first").off("click").on("click", guardarCambiosDesdeFormulario);
  $("#formularioPrecio").show();
}

// 🟢 Guardar precio (crear o editar)
async function guardarCambiosDesdeFormulario() {
  const id = $("#precioID").val();
  const producto_id = $("#productoID").val();
  const precioActual = parseFloat($("#precioActual").val());
  const precioDescuento = parseFloat($("#precioDescuento").val()) || null;
  const unidadLote = $("#unidadLote").val();
  const precioHistorico = $("#precioHistorico").val().split(",").map((p) => parseFloat(p.trim()));

  if (!producto_id || isNaN(precioActual)) {
    alert("⚠️ Producto ID y Precio Actual son obligatorios.");
    return;
  }

  // 🔥 Eliminamos `id` para que MongoDB lo genere automáticamente
  const precio = { producto_id, precioActual, precioDescuento, unidadLote, precioHistorico };

  try {
    let response;
    if (id) {
      response = await fetch(`http://localhost:3000/api/precios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(precio),
      });
    } else {
      response = await fetch("http://localhost:3000/api/precios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(precio),
      });
    }

    if (!response.ok) throw new Error("Error al guardar precio");

    await cargarPrecios();
    cerrarFormulario();
  } catch (err) {
    console.error("❌ Error guardando precio:", err);
  }
}


// 🟢 Editar precio
function editarPrecio(id) {
  const precio = preciosCache.find((p) => p._id === id);
  if (!precio) return;

  $("#formTitulo").text("Editar Precio");
  $("#precioID").val(precio._id);
  $("#productoID").val(precio.producto_id);
  $("#precioActual").val(precio.precioActual);
  $("#precioDescuento").val(precio.precioDescuento || "");
  $("#unidadLote").val(precio.unidadLote || "");
  $("#precioHistorico").val(precio.precioHistorico ? precio.precioHistorico.join(", ") : "");

  $("#botonesFormulario button:first").off("click").on("click", guardarCambiosDesdeFormulario);
  $("#formularioPrecio").show();
}

// 🟢 Eliminar precio
async function eliminarPrecio(id) {
  const confirmacion = confirm("¿Estás seguro de eliminar este precio?");
  if (!confirmacion) return;

  try {
    const response = await fetch(`http://localhost:3000/api/precios/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Error al eliminar precio");

    await cargarPrecios();
  } catch (err) {
    console.error("❌ Error eliminando precio:", err);
  }
}

// 🟢 Cerrar formulario
function cerrarFormulario() {
  $("#formularioPrecio").hide();
  $("#precioID, #productoID, #precioActual, #precioDescuento, #unidadLote, #precioHistorico").val("");
}

// 🟢 Volver atrás
function volverAtras() {
  window.location.href = "../html/intranet.html";
}

// 🟢 Exponer funciones globales
window.editarPrecio = editarPrecio;
window.eliminarPrecio = eliminarPrecio;
window.mostrarFormularioAgregar = mostrarFormularioAgregar;
window.guardarCambiosDesdeFormulario = guardarCambiosDesdeFormulario;
window.cerrarFormulario = cerrarFormulario;
window.volverAtras = volverAtras;
window.cargarPrecios = cargarPrecios;
