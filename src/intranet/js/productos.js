// import { db } from "../../libs/db.js";
// Variables globales
let productosCache = [];
let productosTable;

// Cuando el DOM esté listo:
$(document).ready(() => {
  // 1. Inicializamos la DataTable con la opción responsive
  productosTable = $("#productosTable").DataTable({
    responsive: true, // Para que la tabla se adapte en pantallas pequeñas
    autoWidth: false, // evita forzar anchos que se pasen del contenedor
    scrollX: false,
  });
  // 2. Cargar productos desde la BD y mostrarlos en la tabla
  cargarProductos();

  // 3. Validamos/actualizamos ciertos campos en todos los documentos
  actualizarCampoPeso();
  actualizarCampoImg();
});

/**
 * Cargar los productos desde la base de datos y rellenar la DataTable.
 */
async function cargarProductos() {
  try {
    // Obtenemos todos los documentos
    // const result = await db.allDocs({ include_docs: true });
    // Mapeamos para acceder a la info del doc
    // productosCache = result.rows.map((row) => row.doc);
    const respuesta = await fetch("http://localhost:3000/api/Productos");
    const productos = await respuesta.json();
    productosCache = productos; // 👈 ACTUALIZAMOS EL CACHE GLOBAL

    // Limpiamos cualquier dato previo en la tabla
    productosTable.clear();

    // Agregamos las filas al DataTable
    productosCache.forEach((producto) => {
      productosTable.row.add([
        // 1. ID
        producto._id,
        // 2. Imagen (si existe, mostramos; si no, indicamos "Sin imagen")
        producto.Imagen
          ? `<img src="${producto.Imagen}" alt="Producto" 
               style="width: 50px; height: 50px; object-fit: cover;" />`
          : "Sin imagen",
        // 3. Nombre del producto
        producto.Nombre || "",
        // 4. Marca
        producto.Marca || "",
         // 5. Peso
         producto.Peso
         ? `${producto.Peso} ${producto.UnidadPeso || "kg"}`
         : "0 kg",
        // 6. IDProveedor
        producto.Proveedor_id,
        // 7. IDSupermercado
        producto.Supermercado_id,
        // 8. IDUsuario
        producto.Usuario_id,
        // 9. Estado
        producto.Estado,
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
    const result = await fetch("http://localhost:3000/api/Productos");
    const productos = await result.json();

    for (const producto of productos) {
      if (!producto.hasOwnProperty("peso")) {
        producto.Peso = 0;
        producto.UnidadPeso = "kg";
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
        producto.Imagen = "";
        await db.put(producto);
      }
    }
    console.log('Campo "Imagen" actualizado.');
    cargarProductos();
  } catch (err) {
    console.error('Error actualizando campo "Imagen":', err);
  }
}

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

/**
 * Despliega el formulario para agregar un producto nuevo,
 * limpiando los campos de edición.
 */
function mostrarFormularioAgregar() {
  $("#formTitulo").text("Agregar Producto");
  $(
    "#productoID, #nombreProducto, #marcaProducto, #precioUnidad, #precioLote, #pesoProducto, #nombreSupermercado, #ubicacionSupermercado"
  ).val("");
  $("#unidadPeso").val("kg");
  $("#imgProducto").val(""); // Limpiar el input de imagen

  $("#formularioProducto").show();

  // Desplazamiento suave al formulario
  document
    .getElementById("formularioProducto")
    .scrollIntoView({ behavior: "smooth" });
}

/**
 * Guarda (inserta o actualiza) un producto en la base de datos
 * usando la información del formulario.
 */
async function guardarCambiosDesdeFormulario() {
  // 🔍 Validamos los campos antes de continuar
  // if (!validarCamposFormulario()) return;

  // 🏷️ Obtenemos valores del formulario
  const id = $("#productoID").val().trim();
  const nombre = $("#nombreProducto").val().trim();
  const marca = $("#marcaProducto").val().trim();
  const precioUnidad = parseFloat($("#precioUnidad").val()) || 0;
  const precioLote = parseFloat($("#precioLote").val()) || 0;
  const peso = parseFloat($("#pesoProducto").val()) || 0;
  const unidadPeso = $("#unidadPeso").val();
  const supermercado = $("#nombreSupermercado").val().trim();
  const ubicacion = $("#ubicacionSupermercado").val().trim();
  const biografia = $("#biografiaProducto").val().trim() || "Sin biografía";
  const descripcion =
    $("#descripcionProducto").val().trim() || "Sin descripción";

  // 📸 Convertir imagen a Base64 si se ha seleccionado una
  let imgBase64 = "";
  const imgFile = document.getElementById("imgProducto").files[0];
  if (imgFile) imgBase64 = await convertirImagenABase64(imgFile);

  let doc;

  if (id) {
    // 🔄 **EDITAR PRODUCTO EXISTENTE**
    try {
      const existingDoc = await db.get(id); // 🔍 Obtener el documento actual
      console.log("📄 Documento existente obtenido:", existingDoc); // DEPURACIÓN

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
        biografia,
        descripcion,
        ultimaModificacion: formatearFecha(new Date()),
        img: imgBase64 || existingDoc.img || "",
        historial: [
          ...(existingDoc.historial || []),
          {
            fecha: formatearFecha(new Date()),
            precioUnidad,
            precioLote,
            peso,
          },
        ],
      };
    } catch (err) {
      console.error("❌ Error obteniendo el documento existente:", err);
      return;
    }
  } else {
    // 🆕 **CREAR UN PRODUCTO NUEVO**
    console.log("🆕 Creando un nuevo producto...");

    await cargarProductos(); // 🔄 Asegurar que `productosCache` está actualizado
    const nuevoId = await asignarIDDisponible(); // 🔥 Obtener ID correcto
    console.log("📌 Nuevo ID asignado:", nuevoId); // DEPURACIÓN

    doc = {
      _id: nuevoId,
      nombre,
      marca,
      precioUnidad,
      precioLote,
      peso,
      unidadPeso,
      supermercado,
      ubicacion,
      biografia,
      descripcion,
      ultimaModificacion: formatearFecha(new Date()),
      img: imgBase64,
      historial: [
        {
          fecha: formatearFecha(new Date()),
          precioUnidad,
          precioLote,
          peso,
        },
      ],
    };
  }

  // 📥 **Guardar en la base de datos**
  try {
    console.log("📥 Intentando guardar en db.put:", doc); // DEPURACIÓN
    await db.put(doc);
    console.log("✅ Producto guardado correctamente.");

    cargarProductos(); // 🔄 Recargar la tabla de productos
    cerrarFormulario(); // 🏁 Cerrar el formulario
  } catch (err) {
    console.error("❌ Error guardando producto:", err);

    // ⚠️ **Si hay un conflicto (409), intentamos resolverlo**
    if (err.status === 409) {
      console.warn("⚠️ Conflicto detectado. Recuperando última versión...");

      try {
        const latestDoc = await db.get(doc._id);
        console.log("📄 Última versión obtenida:", latestDoc);

        // 🔄 Fusionar datos sin sobrescribir información
        const mergedDoc = {
          ...latestDoc, // Mantiene el _rev más reciente
          ...doc, // Aplica los cambios del formulario
          historial: [...(latestDoc.historial || []), ...(doc.historial || [])], // Combina historiales
        };

        console.log("📥 Documento fusionado antes de guardar:", mergedDoc);
        await db.put(mergedDoc);
        console.log("✅ Producto guardado después del conflicto.");
      } catch (retryErr) {
        console.error("❌ Error al intentar resolver el conflicto:", retryErr);
      }
    }
  }
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

/**
 * Cierra el formulario de agregar/editar sin guardar.
 */
function cerrarFormulario() {
  $("#formularioProducto").hide();
  $(
    "#productoID, #nombreProducto, #marcaProducto, #precioUnidad, #precioLote, #pesoProducto, #nombreSupermercado, #ubicacionSupermercado"
  ).val("");
  $("#unidadPeso").val("kg");
  $("#imgProducto").val("");
}

/**
 * Redirecciona a la página de intranet (o la que definas).
 */
function volverAtras() {
  window.location.href = "../html/intranet.html";
}
// window.db = db;
window.productosCache = productosCache; // <-- ahora sí lo expones en window
// window.validarCamposFormulario = validarCamposFormulario;
window.editarProducto = editarProducto;
window.eliminarProducto = eliminarProducto;
window.mostrarFormularioAgregar = mostrarFormularioAgregar;
window.guardarCambiosDesdeFormulario = guardarCambiosDesdeFormulario;
window.cerrarFormulario = cerrarFormulario;
window.volverAtras = volverAtras;
