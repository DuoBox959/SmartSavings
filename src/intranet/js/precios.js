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
        precio._id,
        precio.producto_id,
        precio.precioActual.toFixed(2) + " €",
        precio.precioDescuento ? precio.precioDescuento.toFixed(2) + " €" : "N/A",
        precio.unidadLote || "N/A",
        precio.precioHistorico ? precio.precioHistorico.join(", ") + " €" : "N/A",
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

