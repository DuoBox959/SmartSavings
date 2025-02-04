import { db } from "../../libs/db.js";

// Variables globales
let productosTable;
let productosCache = [];

// Inicializar DataTable
$(document).ready(() => {
  productosTable = $("#productosTable").DataTable({
    destroy: true,
    autoWidth: false,
    columns: [
      { title: "ID" },
      { title: "Producto" },
      { title: "Marca" },
      { title: "Precio Unidad" },
      { title: "Precio Lote" },
      { title: "Peso" },
      { title: "Última Modificación" },
      { title: "Supermercado" },
      { title: "Ubicación" },
      { title: "Historial del Producto" },
      { title: "Biografía del Producto" },
      { title: "Imagen" },
      { title: "Acciones" }
    ]
  });

  cargarProductos();
});

// 🟢 Cargar productos en la tabla
async function cargarProductos() {
  try {
    const result = await db.allDocs({ include_docs: true });
    productosCache = result.rows.map(row => row.doc);

    productosTable.clear();

    productosCache.forEach((producto) => {
      const historialHTML = producto.historialProducto
        ? producto.historialProducto.map(h => `<li>${h.año} (${h.mes}): ${h.precioUnidad} € (${h.peso} ${producto.unidadPeso})</li>`).join("")
        : "Sin historial";

      const biografiaHTML = producto.biografiaProducto
        ? producto.biografiaProducto.map(b => `<li>${b.año} (${b.mes}): ${b.precioUnidad} € (${b.peso} ${producto.unidadPeso})</li>`).join("")
        : "Sin datos";

      productosTable.row.add([
        producto._id,
        producto.nombre || "",
        producto.marca || "",
        `${producto.precioUnidad} €`,
        `${producto.precioLote} €`,
        `${producto.peso} ${producto.unidadPeso}`,
        producto.ultimaModificacion || "Sin fecha",
        producto.supermercado || "",
        producto.ubicacion || "",
        `<ul>${historialHTML}</ul>`,
        `<ul>${biografiaHTML}</ul>`,
        producto.img
          ? `<img src="${producto.img}" alt="Producto" style="width: 50px; height: 50px; object-fit: cover;" />`
          : "Sin imagen",
        accionesHTML(producto._id),
      ]);
    });

    productosTable.draw();
  } catch (err) {
    console.error("Error cargando productos:", err);
  }
}

// 🟢 Guardar cambios en producto y actualizar historial
async function guardarCambiosDesdeFormulario() {
  if (!validarCamposFormulario()) return;

  const id = $("#productoID").val();
  const nombre = $("#nombreProducto").val();
  const marca = $("#marcaProducto").val();
  const precioUnidad = parseFloat($("#precioUnidad").val()) || 0;
  const precioLote = parseFloat($("#precioLote").val()) || 0;
  const peso = parseFloat($("#pesoProducto").val()) || 0;
  const unidadPeso = $("#unidadPeso").val();
  const supermercado = $("#nombreSupermercado").val();
  const ubicacion = $("#ubicacionSupermercado").val();
  const añoActual = new Date().getFullYear();
  const mesActual = new Intl.DateTimeFormat("es-ES", { month: "long" }).format(new Date());

  const imgFile = document.getElementById("imgProducto").files[0];
  let imgBase64 = "";
  if (imgFile) {
    imgBase64 = await convertirImagenABase64(imgFile);
  }

  let doc;
  if (id) {
    try {
      const existingDoc = await db.get(id);

      if (!existingDoc.historialProducto) existingDoc.historialProducto = [];
      if (!existingDoc.biografiaProducto) existingDoc.biografiaProducto = [];

      const ultimoRegistro = existingDoc.historialProducto.find(h => h.año === añoActual && h.mes === mesActual);
      if (!ultimoRegistro || ultimoRegistro.precioUnidad !== precioUnidad || ultimoRegistro.peso !== peso) {
        existingDoc.historialProducto.push({ año: añoActual, mes: mesActual, precioUnidad, peso });
      }

      doc = {
        ...existingDoc,
        nombre,
        marca,
        precioUnidad,
        precioLote,
        peso,
        unidadPeso,
        supermercado,
        ubicacion,
        img: imgBase64 || existingDoc.img,
        ultimaModificacion: formatearFecha(new Date()),
      };
    } catch (err) {
      console.error("Error obteniendo el documento existente:", err);
      return;
    }
  } else {
    doc = {
      _id: await asignarIDDisponible(),
      nombre,
      marca,
      precioUnidad,
      precioLote,
      peso,
      unidadPeso,
      supermercado,
      ubicacion,
      img: imgBase64,
      ultimaModificacion: formatearFecha(new Date()),
      historialProducto: [{ año: añoActual, mes: mesActual, precioUnidad, peso }],
      biografiaProducto: []
    };
  }

  try {
    await db.put(doc);
    cargarProductos();
    cerrarFormulario();
  } catch (err) {
    console.error("Error guardando producto:", err);
  }
}

// 🟢 Añadir datos manuales a la biografía del producto
async function agregarBiografiaProducto() {
  const id = $("#productoID").val();
  const año = parseInt($("#anioBiografia").val()) || new Date().getFullYear();
  const mes = $("#mesBiografia").val();
  const precioUnidad = parseFloat($("#precioBiografia").val()) || 0;
  const peso = parseFloat($("#pesoBiografia").val()) || 0;

  if (!id) {
    alert("Primero debes seleccionar o crear un producto.");
    return;
  }

  try {
    const producto = await db.get(id);
    if (!producto.biografiaProducto) producto.biografiaProducto = [];

    producto.biografiaProducto.push({ año, mes, precioUnidad, peso });

    await db.put(producto);
    alert("Biografía del producto actualizada correctamente.");
    cargarProductos();
  } catch (err) {
    console.error("Error actualizando la biografía del producto:", err);
  }
}

// 🟢 Convertir imagen a Base64
function convertirImagenABase64(archivo) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(lector.result);
    lector.onerror = (error) => reject(error);
    lector.readAsDataURL(archivo);
  });
}

// 🟢 Acciones de editar y eliminar
function accionesHTML(id) {
  return id
    ? `<button onclick="editarProducto('${id}')">✏️ Editar</button>
       <button class="btn-eliminar" onclick="eliminarProducto('${id}')">🗑️ Eliminar</button>`
    : "";
}

// 🟢 Funciones globales para el HTML
window.editarProducto = editarProducto;
window.eliminarProducto = eliminarProducto;
window.mostrarFormularioAgregar = mostrarFormularioAgregar;
window.guardarCambiosDesdeFormulario = guardarCambiosDesdeFormulario;
window.cerrarFormulario = cerrarFormulario;
window.volverAtras = volverAtras;
window.agregarBiografiaProducto = agregarBiografiaProducto;
