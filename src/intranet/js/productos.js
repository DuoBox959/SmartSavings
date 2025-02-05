/************************************
 * IMPORTACIONES Y VARIABLES GLOBALES
 ************************************/
import { db } from "../../libs/db.js";

// Variables globales
let productosTable;
let productosCache = [];

/************************************
 * INICIALIZACIÓN AL CARGAR EL DOM
 ************************************/
// Cuando el DOM esté listo:
$(document).ready(() => {
  // 1. Inicializamos la DataTable con la opción responsive
  productosTable = $("#productosTable").DataTable({
    responsive: true, // Para que la tabla se adapte en pantallas pequeñas
    autoWidth: false,    // evita forzar anchos que se pasen del contenedor
    scrollX: false  
  });
  // 2. Cargar productos desde la BD y mostrarlos en la tabla
  cargarProductos();

  // 3. Validamos/actualizamos ciertos campos en todos los documentos
  actualizarCampoPeso();
  actualizarCampoImg();
  actualizarCampoHistorial();
  actualizarCampoBiografia();
});

/************************************
 * FUNCIONES PRINCIPALES PARA CARGAR Y ACTUALIZAR DATOS
 ************************************/

/**
 * Cargar los productos desde la base de datos y rellenar la DataTable.
 */
async function cargarProductos() {
  try {
    // Obtenemos todos los documentos
    const result = await db.allDocs({ include_docs: true });
    // Mapeamos para acceder a la info del doc
    productosCache = result.rows.map((row) => row.doc);

    // Limpiamos cualquier dato previo en la tabla
    productosTable.clear();

    // Agregamos las filas al DataTable
    productosCache.forEach((producto) => {
      productosTable.row.add([
        // 1. ID
        producto._id,
        // 2. Nombre del producto
        producto.nombre || "",
        // 3. Marca
        producto.marca || "",
        // 4. Precio Unidad
        producto.precioUnidad ? `${producto.precioUnidad} €` : "0 €",
        // 5. Precio Lote
        producto.precioLote ? `${producto.precioLote} €` : "0 €",
        // 6. Peso
        producto.peso
          ? `${producto.peso} ${producto.unidadPeso || "kg"}`
          : "0 kg",
        // 7. Última Modificación
        producto.ultimaModificacion || "Sin fecha",
        // 8. Supermercado
        producto.supermercado || "",
        // 9. Ubicación
        producto.ubicacion || "",
        // 10. Historial
        `<button onclick="verHistorial('${producto._id}')">Ver Historial</button>`,
        // 11. Biografía
        producto.biografia || "Sin biografía",
        // 12. Imagen (si existe, mostramos; si no, indicamos "Sin imagen")
        producto.img
          ? `<img src="${producto.img}" alt="Producto" 
               style="width: 50px; height: 50px; object-fit: cover;" />`
          : "Sin imagen",
        // 13. Descripción
        producto.descripcion || "Sin descripción",
        // 14. Acciones (editar/eliminar)
        accionesHTML(producto._id),
      ]);
    });

    // Redibujar la tabla después de añadir todos los productos
    productosTable.draw();
  } catch (err) {
    console.error("Error cargando productos:", err);
  }
}

/**
 * Asegura que todos los documentos/productos en la BD
 * posean el campo "peso" y "unidadPeso". Si no existe,
 * se inicializa y se sube a la BD.
 */
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
    // Recargar la tabla para reflejar los cambios
    cargarProductos();
  } catch (err) {
    console.error('Error actualizando campo "peso":', err);
  }
}

/**
 * Asegura que todos los documentos/productos en la BD
 * posean el campo "img". Si no existe, se inicializa en "".
 */
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

/**
 * Asegura que todos los productos posean el campo "historial".
 * Si no existe, lo creamos como un array vacío.
 */
async function actualizarCampoHistorial() {
  try {
    const result = await db.allDocs({ include_docs: true });
    const productos = result.rows.map((row) => row.doc);

    for (const producto of productos) {
      if (!producto.hasOwnProperty("historial")) {
        producto.historial = [];
        await db.put(producto);
      }
    }
    console.log('Campo "historial" actualizado.');
    cargarProductos();
  } catch (err) {
    console.error('Error actualizando campo "historial":', err);
  }
}

/**
 * Asegura que todos los productos posean el campo "biografia".
 * Si no existe, lo creamos con un texto por defecto.
 */
async function actualizarCampoBiografia() {
  try {
    const result = await db.allDocs({ include_docs: true });
    const productos = result.rows.map((row) => row.doc);

    for (const producto of productos) {
      if (!producto.hasOwnProperty("biografia")) {
        producto.biografia = "Sin biografía";
        await db.put(producto);
      }
    }
    console.log('Campo "biografia" actualizado.');
    cargarProductos();
  } catch (err) {
    console.error('Error actualizando campo "biografia":', err);
  }
}

/************************************
 * FUNCIONES DE UTILIDAD (HELPERS)
 ************************************/

/**
 * Devuelve la estructura de botones HTML para editar y eliminar un producto.
 * @param {string} id - El ID del producto
 * @returns {string} - HTML con botones de acción
 */
function accionesHTML(id) {
  return `
    <button class="btn-accion btn-editar" onclick="editarProducto('${id}')">
      <i class="fa-solid fa-pencil"></i> ✏️Editar
    </button>
    <button class="btn-accion btn-eliminar" onclick="eliminarProducto('${id}')">
        🗑️Eliminar
    </button>
  `;
}


/**
 * Convierte una imagen a Base64 para poder almacenarla en la BD.
 * @param {File} archivo - El archivo de imagen
 * @returns {Promise<string>} - Promesa que resuelve con el string Base64
 */
function convertirImagenABase64(archivo) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(lector.result);
    lector.onerror = (error) => reject(error);
    lector.readAsDataURL(archivo);
  });
}

/**
 * Formatea una fecha en formato "dd/mm/yyyy hh:mm:ss".
 * @param {Date} fecha - Objeto Date a formatear
 * @returns {string}
 */
function formatearFecha(fecha) {
  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const anio = fecha.getFullYear();
  const horas = String(fecha.getHours()).padStart(2, "0");
  const minutos = String(fecha.getMinutes()).padStart(2, "0");
  const segundos = String(fecha.getSeconds()).padStart(2, "0");

  return `${dia}/${mes}/${anio} ${horas}:${minutos}:${segundos}`;
}

/************************************
 * FUNCIONES PARA MANIPULACIÓN DE PRODUCTOS (CRUD)
 ************************************/

/**
 * Despliega el formulario para agregar un producto nuevo,
 * limpiando los campos de edición.
 */
function mostrarFormularioAgregar() {
  $("#formTitulo").text("Agregar Producto");
  $("#productoID, #nombreProducto, #marcaProducto, #precioUnidad, #precioLote, #pesoProducto, #nombreSupermercado, #ubicacionSupermercado").val("");
  $("#unidadPeso").val("kg");
  $("#imgProducto").val(""); // Limpiar el input de imagen

  $("#formularioProducto").show();
}

/**
 * Guarda (inserta o actualiza) un producto en la base de datos
 * usando la información del formulario.
 */
async function guardarCambiosDesdeFormulario() {
  // Primero, validamos los campos con tu función custom de validación (si la tienes).
  if (!validarCamposFormulario()) return;

  // Obtenemos valores del formulario
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

  // Convertir imagen a Base64 (solo si se selecciona un archivo nuevo)
  const imgFile = document.getElementById("imgProducto").files[0];
  let imgBase64 = "";
  if (imgFile) {
    imgBase64 = await convertirImagenABase64(imgFile);
  }

  // Variable para el documento a guardar
  let doc;

  if (id) {
    // EDITAR PRODUCTO EXISTENTE
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
        biografia: biografia || existingDoc.biografia || "Sin biografía",
        historial: existingDoc.historial || [],
        ultimaModificacion: formatearFecha(new Date()),
        descripcion
      };

      // Añadir nueva entrada al historial
      doc.historial.push({
        fecha: formatearFecha(new Date()),
        precioUnidad,
        precioLote,
        peso,
      });

      // Mantener o actualizar imagen
      doc.img = imgBase64 || existingDoc.img || "";

    } catch (err) {
      console.error("Error obteniendo el documento existente:", err);
      return;
    }
  } else {
    // CREAR UN PRODUCTO NUEVO
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
      historial: [
        {
          fecha: formatearFecha(new Date()),
          precioUnidad,
          precioLote,
          peso,
        },
      ],
      img: imgBase64,
      ultimaModificacion: formatearFecha(new Date()),
      descripcion
    };
  }

  // Guardar en la base de datos
  try {
    await db.put(doc);
    // Recargar productos en la tabla
    cargarProductos();
    // Cerrar el formulario
    cerrarFormulario();
  } catch (err) {
    console.error("Error guardando producto:", err);
  }
}

/**
 * Muestra el historial de precios y peso de un producto usando SweetAlert2.
 * @param {string} id - ID del producto
 */
function verHistorial(id) {
  const producto = productosCache.find((p) => p._id === id);
  if (!producto) return;

  let historialHTML = "<h3>Historial de Precios y Pesos</h3><ul>";

  if (producto.historial && producto.historial.length > 0) {
    producto.historial.forEach((entry) => {
      historialHTML += `
        <li>
          ${entry.fecha} - 
          Precio Unidad: ${entry.precioUnidad} €, 
          Precio Lote: ${entry.precioLote} €, 
          Peso: ${entry.peso} ${producto.unidadPeso}
        </li>
      `;
    });
  } else {
    historialHTML += "<li>Sin historial disponible.</li>";
  }

  historialHTML += "</ul>";

  Swal.fire({
    title: `Historial de ${producto.nombre}`,
    html: historialHTML,
    confirmButtonText: "Cerrar",
  });
}

/**
 * Editar un producto: carga los datos de la BD en el formulario.
 * @param {string} id - ID del producto
 */
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
  $("#imgProducto").val(""); // Limpiar input para seleccionar otra imagen si se desea

  // Opcional: mostrar una vista previa de la imagen existente
  if (producto.img) {
    $("#formTitulo").after(`
      <img 
        src="${producto.img}" 
        alt="Producto" 
        style="width: 100px; height: 100px; object-fit: cover;" 
      />
    `);
  }

  $("#formularioProducto").show();
}

/**
 * Elimina un producto tras confirmación del usuario.
 * @param {string} id - ID del producto
 */
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

/************************************
 * FUNCIONES DE NAVEGACIÓN Y FORMULARIO
 ************************************/

/**
 * Cierra el formulario de agregar/editar sin guardar.
 */
function cerrarFormulario() {
  $("#formularioProducto").hide();
  $("#productoID, #nombreProducto, #marcaProducto, #precioUnidad, #precioLote, #pesoProducto, #nombreSupermercado, #ubicacionSupermercado").val("");
  $("#unidadPeso").val("kg");
  $("#imgProducto").val("");
}

/**
 * Redirecciona a la página de intranet (o la que definas).
 */
function volverAtras() {
  window.location.href = "../html/intranet.html";
}

/************************************
 * EXPOSICIÓN DE FUNCIONES EN EL OBJETO GLOBAL (WINDOW)
 * Para que puedan ser llamadas desde el HTML
 ************************************/
window.editarProducto = editarProducto;
window.eliminarProducto = eliminarProducto;
window.mostrarFormularioAgregar = mostrarFormularioAgregar;
window.guardarCambiosDesdeFormulario = guardarCambiosDesdeFormulario;
window.cerrarFormulario = cerrarFormulario;
window.volverAtras = volverAtras;
