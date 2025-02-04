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

<<<<<<< HEAD
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
=======
// 🟢 Guardar cambios en producto y actualizar historial
>>>>>>> 67180a54b4ccf8b7b56c5351fa5c24a87e1231c8
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
  const descripcion = $("#descripcionProducto").val(); // ✅ Nueva descripción
  const usuarioActual = JSON.parse(localStorage.getItem("usuarioActual")) || {}; // ✅ Obtener usuario actual

  const añoActual = new Date().getFullYear();
  const mesActual = new Intl.DateTimeFormat("es-ES", { month: "long" }).format(new Date());

  let doc;
  if (id) {
    try {
      const existingDoc = await db.get(id);
      if (!existingDoc.historialProducto) existingDoc.historialProducto = [];

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
        descripcion, // ✅ Guardar descripción
        ultimaModificacion: new Date().toISOString(),
      };
    } catch (err) {
      console.error("Error obteniendo producto:", err);
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
      descripcion, // ✅ Nueva descripción
      ultimaModificacion: new Date().toISOString(),
      historialProducto: [{ año: añoActual, mes: mesActual, precioUnidad, peso }],
      biografiaProducto: [],
      creadoPor: usuarioActual._id || "desconocido", // ✅ Relacionamos producto con usuario
    };
    
    // ✅ Guardar el ID en productosCreados del usuario
    try {
      const usuario = await db.get(usuarioActual._id);
      usuario.productosCreados = usuario.productosCreados || [];
      usuario.productosCreados.push(doc._id);
      await db.put(usuario);
    } catch (err) {
      console.error("Error actualizando usuario con productos creados:", err);
    }
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
