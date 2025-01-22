import { db } from "../libs/db.js";


// Variables globales
let productosTable;
let productosCache = [];

$(document).ready(() => {
  productosTable = $("#productosTable").DataTable();
  cargarProductos();
  actualizarCampoPeso(); // Actualiza documentos existentes con el campo "peso"
});

async function cargarProductos() {
  try {
    const result = await db.allDocs({ include_docs: true });
    productosCache = result.rows.map((row) => row.doc);

    productosTable.clear();
    productosCache.forEach((producto) => {
      productosTable.row.add([
        producto._id,
        producto.nombre || "",
        producto.marca || "",
        producto.precioUnidad ? `${producto.precioUnidad} €` : "0 €",
        producto.precioLote ? `${producto.precioLote} €` : "0 €",
        producto.peso
          ? `${producto.peso} ${producto.unidadPeso || "kg"}`
          : "0 kg", // Mostrar peso con unidad seleccionada
        producto.ultimaModificacion || "Sin fecha",
        producto.supermercado || "",
        producto.ubicacion || "",
        accionesHTML(producto._id),
      ]);
    });
    productosTable.draw();
  } catch (err) {
    console.error("Error cargando productos:", err);
  }
}

async function actualizarCampoPeso() {
  try {
    const result = await db.allDocs({ include_docs: true });
    const productos = result.rows.map((row) => row.doc);

    for (const producto of productos) {
      if (!producto.hasOwnProperty("peso")) {
        producto.peso = 0; // Valor por defecto
        producto.unidadPeso = "kg"; // Establecer la unidad por defecto
        await db.put(producto);
      }
    }
    console.log('Campo "peso" actualizado en todos los documentos.');
    cargarProductos(); // Recargar tabla
  } catch (err) {
    console.error('Error actualizando campo "peso":', err);
  }
}

function accionesHTML(id) {
  return `
        <button onclick="editarProducto('${id}')">Editar</button>
        <button class="btn-eliminar" onclick="eliminarProducto('${id}')">Eliminar</button>
    `;
}

function mostrarFormularioAgregar() {
  $("#formTitulo").text("Agregar Producto");
  $(
    "#productoID, #nombreProducto, #marcaProducto, #precioUnidad, #precioLote, #pesoProducto, #nombreSupermercado, #ubicacionSupermercado"
  ).val("");
  $("#unidadPeso").val("kg"); // Establecer unidad por defecto
  $("#formularioProducto").show();
  document
    .getElementById("formularioProducto")
    .scrollIntoView({ behavior: "smooth" }); // Desplazamiento suave al formulario
}

async function guardarCambiosDesdeFormulario() {
  if (!validarCamposFormulario()) return;

  const id = $("#productoID").val();
  const nombre = $("#nombreProducto").val();
  const marca = $("#marcaProducto").val();
  const precioUnidad = parseFloat($("#precioUnidad").val()) || 0;
  const precioLote = parseFloat($("#precioLote").val()) || 0;
  const peso = parseFloat($("#pesoProducto").val()) || 0;
  const unidadPeso = $("#unidadPeso").val(); // Obtener la unidad seleccionada
  const supermercado = $("#nombreSupermercado").val();
  const ubicacion = $("#ubicacionSupermercado").val();

  let doc;

  if (id) {
    try {
      const existingDoc = await db.get(id);
      doc = {
        ...existingDoc,
        nombre,
        marca,
        precioUnidad,
        precioLote,
        peso,
        unidadPeso, // Guardar unidad de peso
        supermercado,
        ubicacion,
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
      unidadPeso, // Guardar unidad de peso
      supermercado,
      ubicacion,
      ultimaModificacion: formatearFecha(new Date()),
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

function editarProducto(id) {
  const producto = productosCache.find((p) => p._id === id);
  if (!producto) return;

  $("#formTitulo").text("Editar Producto");
  $("#productoID").val(producto._id);
  $("#nombreProducto").val(producto.nombre || "");
  $("#marcaProducto").val(producto.marca || "");
  $("#precioUnidad").val(producto.precioUnidad || "");
  $("#precioLote").val(producto.precioLote || "");
  $("#pesoProducto").val(producto.peso || 0); // Cargar peso
  $("#unidadPeso").val(producto.unidadPeso || "kg"); // Cargar unidad de peso
  $("#nombreSupermercado").val(producto.supermercado || "");
  $("#ubicacionSupermercado").val(producto.ubicacion || "");
  $("#formularioProducto").show();
}

async function eliminarProducto(id) {
  const producto = productosCache.find((p) => p._id === id);
  if (!producto) return;

  if (confirm("¿Estás seguro de eliminar este producto?")) {
    try {
      await db.remove(producto);
      cargarProductos();
    } catch (err) {
      console.error("Error eliminando producto:", err);
    }
  }
}
// Esto se pone porque el script es tipo module, para exponer las funciones al ámbito global usando window
window.editarProducto = editarProducto;
window.eliminarProducto = eliminarProducto;
window.mostrarFormularioAgregar = mostrarFormularioAgregar;
window.guardarCambiosDesdeFormulario = guardarCambiosDesdeFormulario;
window.cerrarFormulario = cerrarFormulario;
window.volverAtras= volverAtras;

function volverAtras() {
  window.location.href = "../pages/index.html"; }



function cerrarFormulario() {
  $("#formularioProducto").hide();
  $(
    "#productoID, #nombreProducto, #marcaProducto, #precioUnidad, #precioLote, #pesoProducto, #nombreSupermercado, #ubicacionSupermercado"
  ).val("");
  $("#unidadPeso").val("kg"); // Resetear unidad a kg
}

// Función para formatear la fecha y hora en un formato legible

function formatearFecha(fechaISO) {
  const fecha = new Date(fechaISO);
  const dia = fecha.getDate().toString().padStart(2, "0");
  const mes = (fecha.getMonth() + 1).toString().padStart(2, "0");
  const anio = fecha.getFullYear();
  const horas = fecha.getHours().toString().padStart(2, "0");
  const minutos = fecha.getMinutes().toString().padStart(2, "0");
  const segundos = fecha.getSeconds().toString().padStart(2, "0");
  return `${dia}/${mes}/${anio} ${horas}:${minutos}:${segundos}`;
}
