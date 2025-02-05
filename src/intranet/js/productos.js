import { db } from "../../libs/db.js";

// Variables globales
let productosTable;
let productosCache = [];

$(document).ready(() => {
  productosTable = $("#productosTable").DataTable();
  cargarProductos();
  actualizarCampoPeso();
  actualizarCampoImg(); 
  actualizarCampoHistorial();
  actualizarCampoBiografia(); 
});

// 🟢 Cargar productos en la tabla
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
        producto.peso ? `${producto.peso} ${producto.unidadPeso || "kg"}` : "0 kg",
        producto.ultimaModificacion || "Sin fecha",
        producto.supermercado || "",
        producto.ubicacion || "",
        `<button onclick="verHistorial('${producto._id}')">Ver Historial</button>`, // 🟢 Botón para historial
        producto.biografia || "Sin biografía", // 🟢 Mostrar la biografía directamente
        producto.img
          ? `<img src="${producto.img}" alt="Producto" style="width: 50px; height: 50px; object-fit: cover;" />`
          : "Sin imagen",
        producto.descripcion || "Sin descripción", 
        accionesHTML(producto._id),
      ]);
    });
    productosTable.draw();
  } catch (err) {
    console.error("Error cargando productos:", err);
  }
}

// 🟢 Asegurar que todos los productos tienen el campo "peso"
async function actualizarCampoPeso() {
  try {
    const result = await db.allDocs({ include_docs: true });
    const productos = result.rows.map((row) => row.doc);

    for (const producto of productos) {
      if (!producto.hasOwnProperty("peso")) {
        producto.peso = 0;
        producto.unidadPeso = "kg";
        await db.put(producto);
      }
    }
    console.log('Campo "peso" actualizado.');
    cargarProductos();
  } catch (err) {
    console.error('Error actualizando campo "peso":', err);
  }
}

// 🟢 Asegurar que todos los productos tienen el campo "img"
async function actualizarCampoImg() {
  try {
    const result = await db.allDocs({ include_docs: true });
    const productos = result.rows.map((row) => row.doc);

    for (const producto of productos) {
      if (!producto.hasOwnProperty("img")) {
        producto.img = "";
        await db.put(producto);
      }
    }
    console.log('Campo "img" actualizado.');
    cargarProductos();
  } catch (err) {
    console.error('Error actualizando campo "img":', err);
  }
}
// 🟢 Asegurar que todos los productos tienen el campo "historial"
async function actualizarCampoHistorial() {
  try {
    const result = await db.allDocs({ include_docs: true });
    const productos = result.rows.map((row) => row.doc);

    for (const producto of productos) {
      if (!producto.hasOwnProperty("historial")) {
        producto.historial = []; // Inicializamos como un array vacío
        await db.put(producto);
      }
    }
    console.log('Campo "historial" actualizado.');
    cargarProductos();
  } catch (err) {
    console.error('Error actualizando campo "historial":', err);
  }
}

// 🟢 Asegurar que todos los productos tienen el campo "biografia"
async function actualizarCampoBiografia() {
  try {
    const result = await db.allDocs({ include_docs: true });
    const productos = result.rows.map((row) => row.doc);

    for (const producto of productos) {
      if (!producto.hasOwnProperty("biografia")) {
        producto.biografia = "Sin biografía"; // Inicializamos con un texto predeterminado
        await db.put(producto);
      }
    }
    console.log('Campo "biografia" actualizado.');
    cargarProductos();
  } catch (err) {
    console.error('Error actualizando campo "biografia":', err);
  }
}

// 🟢 Acciones de editar y eliminar
function accionesHTML(id) {
  return `
    <button onclick="editarProducto('${id}')">Editar</button>
    <button class="btn-eliminar" onclick="eliminarProducto('${id}')">Eliminar</button>
  `;
}

// 🟢 Mostrar formulario para agregar producto
function mostrarFormularioAgregar() {
  $("#formTitulo").text("Agregar Producto");
  $("#productoID, #nombreProducto, #marcaProducto, #precioUnidad, #precioLote, #pesoProducto, #nombreSupermercado, #ubicacionSupermercado").val("");
  $("#unidadPeso").val("kg");
  $("#imgProducto").val(""); // Limpiar el input de imagen
  $("#formularioProducto").show();
}

// 🗓️ Formatear fecha en formato legible (dd/mm/yyyy hh:mm:ss)
function formatearFecha(fecha) {
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const anio = fecha.getFullYear();
  const horas = String(fecha.getHours()).padStart(2, '0');
  const minutos = String(fecha.getMinutes()).padStart(2, '0');
  const segundos = String(fecha.getSeconds()).padStart(2, '0');

  return `${dia}/${mes}/${anio} ${horas}:${minutos}:${segundos}`;
}

// 🟢 Guardar cambios desde el formulario
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
  const biografia = $("#biografiaProducto").val(); 
  const descripcion = $("#descripcionProducto").val();

  // Convertir imagen a Base64 solo si hay una nueva imagen
  const imgFile = document.getElementById("imgProducto").files[0];
  let imgBase64 = "";

  if (imgFile) {
    imgBase64 = await convertirImagenABase64(imgFile);
  }

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
        unidadPeso,
        supermercado,
        ubicacion,
        biografia: biografia || existingDoc.biografia || "Sin biografía", // ✅ Mantener biografía existente si no se actualiza
        historial: existingDoc.historial || [], // ✅ Asegurar que haya un historial existente
        ultimaModificacion: formatearFecha(new Date()),
        descripcion
      };

      // ✅ Añadir al historial en lugar de sobrescribirlo
      doc.historial.push({
        fecha: formatearFecha(new Date()),
        precioUnidad,
        precioLote,
        peso,
      });

      // ✅ Mantener imagen existente si no se carga una nueva
      doc.img = imgBase64 || existingDoc.img || "";

    } catch (err) {
      console.error("Error obteniendo el documento existente:", err);
      return;
    }
  } else {
    // ✅ Si es un nuevo producto
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
      biografia: biografia || "Sin biografía",
      historial: [{
        fecha: formatearFecha(new Date()),
        precioUnidad,
        precioLote,
        peso,
      }],
      img: imgBase64,
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

function verHistorial(id) {
  const producto = productosCache.find(p => p._id === id);
  if (!producto) return;

  let historialHTML = "<h3>Historial de Precios y Pesos</h3><ul>";

  if (producto.historial && producto.historial.length > 0) {
    producto.historial.forEach(entry => {
      historialHTML += `<li>${entry.fecha} - Precio Unidad: ${entry.precioUnidad} €, Precio Lote: ${entry.precioLote} €, Peso: ${entry.peso} ${producto.unidadPeso}</li>`;
    });
  } else {
    historialHTML += "<li>Sin historial disponible.</li>";
  }

  historialHTML += "</ul>";

  Swal.fire({
    title: `Historial de ${producto.nombre}`,
    html: historialHTML,
    confirmButtonText: "Cerrar"
  });
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

// 🟢 Editar un producto
function editarProducto(id) {
  const producto = productosCache.find((p) => p._id === id);
  if (!producto) return;

  $("#formTitulo").text("Editar Producto");
  $("#productoID").val(producto._id);
  $("#nombreProducto").val(producto.nombre || "");
  $("#marcaProducto").val(producto.marca || "");
  $("#precioUnidad").val(producto.precioUnidad || "");
  $("#precioLote").val(producto.precioLote || "");
  $("#pesoProducto").val(producto.peso || 0);
  $("#unidadPeso").val(producto.unidadPeso || "kg");
  $("#nombreSupermercado").val(producto.supermercado || "");
  $("#ubicacionSupermercado").val(producto.ubicacion || "");
  $("#biografiaProducto").val(producto.biografia || "");

  // ✅ Previsualización de imagen existente
  if (producto.img) {
    $("#formTitulo").after(`<img src="${producto.img}" alt="Producto" style="width: 100px; height: 100px; object-fit: cover;" />`);
  }

  $("#formularioProducto").show();
}

// 🟢 Eliminar un producto
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

// 🟢 Funciones globales para el HTML
window.editarProducto = editarProducto;
window.eliminarProducto = eliminarProducto;
window.mostrarFormularioAgregar = mostrarFormularioAgregar;
window.guardarCambiosDesdeFormulario = guardarCambiosDesdeFormulario;
window.cerrarFormulario = cerrarFormulario;
window.volverAtras = volverAtras;

function volverAtras() {
  window.location.href = "../html/intranet.html";
}

function cerrarFormulario() {
  $("#formularioProducto").hide();
  $("#productoID, #nombreProducto, #marcaProducto, #precioUnidad, #precioLote, #pesoProducto, #nombreSupermercado, #ubicacionSupermercado").val("");
  $("#unidadPeso").val("kg");
  $("#imgProducto").val("");
}
