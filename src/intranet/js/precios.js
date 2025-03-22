// 🔹 Variables globales
let preciosTable;
let preciosCache = [];
let productosCache = {}; // 🆕 Guardar productos en caché para acceso rápido

// 🔹 Iniciar DataTable y cargar datos cuando el documento esté listo
$(document).ready(async () => {
  preciosTable = $("#preciosTable").DataTable({
    destroy: true,
    autoWidth: false,
    columns: [
      { title: "ID" },
      { title: "Producto" },
      { title: "Precio Actual" },
      { title: "Precio Descuento" },
      { title: "Unidad/Lote" },
      { title: "Precio Histórico" },
      { title: "Acciones" },
    ],
  });

  // 🆕 Esperar a que los productos se carguen antes de los precios
  await cargarProductos();
  await cargarPrecios();
});

// 🟢 Cargar productos y llenar el select
async function cargarProductos() {
  try {
    const respuesta = await fetch("http://localhost:3000/api/productos");
    const productos = await respuesta.json();

    if (!Array.isArray(productos))
      throw new Error("Formato incorrecto en productos");

    // Guardar productos en caché con estructura { id: nombre }
    productos.forEach((producto) => {
      productosCache[producto._id] = producto.Nombre; // 🔥 Asegurar que la clave es correcta
    });

    // Llenar el select de productos
    const select = $("#productoID");
    select.empty().append('<option value="">Selecciona un producto</option>');
    productos.forEach((producto) => {
      select.append(
        `<option value="${producto._id}">${producto.Nombre}</option>`
      );
    });

    console.log("✅ Productos cargados:", productosCache);
  } catch (error) {
    console.error("❌ Error al cargar productos:", error);
  }
}

// 🟢 Cargar precios desde servidor Express
async function cargarPrecios() {
  try {
    const respuesta = await fetch("http://localhost:3000/api/precios");
    const precios = await respuesta.json();

    if (!Array.isArray(precios))
      throw new Error("Formato incorrecto en precios");

    preciosCache = precios;
    preciosTable.clear(); // Limpiamos la tabla antes de actualizar

    precios.forEach((precio) => {
      const nombreProducto =
        productosCache[precio.producto_id] || "Producto Desconocido"; // 🛠️ Ahora sí debería aparecer bien

      preciosTable.row.add([
        precio._id || "N/A",
        nombreProducto, // 🔄 Mostrar nombre del producto correctamente
        typeof precio.precioActual === "number"
          ? precio.precioActual.toFixed(2) + " €"
          : "N/A",
        typeof precio.precioDescuento === "number"
          ? precio.precioDescuento.toFixed(2) + " €"
          : "N/A",
        precio.unidadLote || "N/A",
        `<button class="btn btn-primary" onclick="verPrecioHistorico('${precio._id}')">Ver Precio Histórico</button>`,
        accionesHTML(precio._id),
      ]);
    });

    console.log("✅ Precios cargados con nombres de productos:", precios);
    preciosTable.draw();
  } catch (error) {
    console.error("❌ Error al cargar precios:", error);
  }
}

function verPrecioHistorico(id) {
  const precio = preciosCache.find((p) => p._id === id);
  if (!precio) return;

  const preciosHistoricos = Array.isArray(precio.precioHistorico)
    ? precio.precioHistorico
        .map((p) => (typeof p === "number" ? p.toFixed(2) + " €" : "N/A"))
        .join(", ")
    : "No disponible";

  Swal.fire({
    title: "💰 Historial de Precios",
    text: preciosHistoricos,
    icon: "info",
    confirmButtonText: "Aceptar",
    width: "600px",
  });
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
  $(
    "#precioID, #productoID, #precioActual, #precioDescuento, #unidadLote, #precioHistorico"
  ).val("");

  $("#botonesFormulario button:first")
    .off("click")
    .on("click", guardarCambiosDesdeFormulario);

  $("#formularioPrecio").show();
  document
    .getElementById("formularioPrecio")
    .scrollIntoView({ behavior: "smooth" });
}

// 🟢 Guardar precio (crear o editar)
async function guardarCambiosDesdeFormulario() {
  const id = $("#precioID").val();
  const producto_id = $("#productoID").val();
  const precioActual = parseFloat($("#precioActual").val());
  const precioDescuento = parseFloat($("#precioDescuento").val()) || null;
  const unidadLote = $("#unidadLote").val();
  const precioHistorico = $("#precioHistorico")
    .val()
    .split(",")
    .map((p) => parseFloat(p.trim()));

  if (!producto_id || isNaN(precioActual)) {
    alert("⚠️ Producto ID y Precio Actual son obligatorios.");
    return;
  }

  // 🔥 Eliminamos `id` para que MongoDB lo genere automáticamente
  const precio = {
    producto_id,
    precioActual,
    precioDescuento,
    unidadLote,
    precioHistorico,
  };

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
  $("#precioHistorico").val(
    precio.precioHistorico ? precio.precioHistorico.join(", ") : ""
  );

  $("#botonesFormulario button:first")
    .off("click")
    .on("click", guardarCambiosDesdeFormulario);

  $("#formularioPrecio").show();
  document
    .getElementById("formularioPrecio")
    .scrollIntoView({ behavior: "smooth" });
}

// 🟢 Eliminar precio
async function eliminarPrecio(id) {
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
    const response = await fetch(`http://localhost:3000/api/precios/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Error al eliminar precio");

    await Swal.fire("Eliminado", "El precio ha sido eliminado.", "success");

    await cargarPrecios();
  } catch (err) {
    console.error("❌ Error eliminando precio:", err);
    Swal.fire("Error", "No se pudo eliminar el precio.", "error");
  }
}

// 🟢 Cerrar formulario
function cerrarFormulario() {
  $("#formularioPrecio").hide();
  $(
    "#precioID, #productoID, #precioActual, #precioDescuento, #unidadLote, #precioHistorico"
  ).val("");
}

// 🟢 Exponer funciones globales
window.editarPrecio = editarPrecio;
window.eliminarPrecio = eliminarPrecio;
window.mostrarFormularioAgregar = mostrarFormularioAgregar;
window.guardarCambiosDesdeFormulario = guardarCambiosDesdeFormulario;
window.cerrarFormulario = cerrarFormulario;
window.cargarPrecios = cargarPrecios;
window.verPrecioHistorico = verPrecioHistorico;
