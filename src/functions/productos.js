// ==============================
// 📦 IMPORTACIONES DE FUNCIONES EXTERNAS
// ==============================
import { cargarHeaderFooter, volverAtras, cargarNav, renderizarProductos } from "../functions/global/funciones.js";
import { gestionarUsuarioAutenticado } from "../functions/global/header.js";
import { aplicarFiltroBusqueda } from "../functions/global/nav.js";

// ✅ Exposición global de función volverAtras
window.volverAtras = volverAtras;

// 🌎 API base URL
const API_URL = "http://localhost:3000/api/productos";

// ==============================
// 🚀 INICIALIZACIÓN AL CARGAR DOCUMENTO
// ==============================
document.addEventListener("DOMContentLoaded", async () => {
  // 🔒 Verificar si el usuario está autenticado
  const usuario = sessionStorage.getItem("user");
  if (!usuario) {
    Swal.fire({
      icon: "warning",
      title: "No has iniciado sesión",
      text: "Por favor, inicia sesión para continuar.",
      confirmButtonText: "Ir al inicio",
      allowOutsideClick: false,
    }).then(() => {
      window.location.href = "index.html";
    });
    return;
  }

  try {
    await cargarHeaderFooter();

    // 📦 Obtener productos y precios en paralelo
    const [productosRes, preciosRes] = await Promise.all([
      fetch("http://localhost:3000/api/productos"),
      fetch("http://localhost:3000/api/precios")
    ]);

    const productos = await productosRes.json();
    const precios = await preciosRes.json();

    await cargarNav(productos, precios);
    renderizarProductos(productos, precios);
    aplicarFiltroBusqueda();
    gestionarUsuarioAutenticado();

    // 📥 Cargar opciones dinámicas en los selects
    await cargarOpcionesEnSelects([
      { campo: "supermercado", endpoint: "supermercados", usarId: true },
      { campo: "tipo", endpoint: "tipos", usarId: false },
      { campo: "subtipo", endpoint: "subtipos", usarId: false },
      { campo: "marca", endpoint: "marcas", usarId: false },
      { campo: "proveedor", endpoint: "proveedor", usarId: true }
    ]);

  } catch (error) {
    console.error("Error en la inicialización:", error);
  }
});

// ==============================
// 📥 FUNCIONES DE CARGA Y LISTADO
// ==============================

// 📥 Cargar productos y precios para renderizar en el listado principal
async function cargarProductos() {
  try {
    const [productosRes, preciosRes] = await Promise.all([
      fetch("http://localhost:3000/api/productos"),
      fetch("http://localhost:3000/api/precios")
    ]);
    const productos = await productosRes.json();
    const precios = await preciosRes.json();

    renderizarProductos(productos, precios);
  } catch (err) {
    console.error("Error cargando productos:", err);
  }
}

// ✅ Exponer carga de productos globalmente para refrescar la vista
window.cargarProductos = cargarProductos;

// 📥 Cargar datos dinámicos en los selects (tipo, marca, etc.)
async function cargarOpcionesEnSelects(configs) {
  try {
    const fetchPromises = configs.map(({ campo, endpoint }) =>
      fetch(`http://localhost:3000/api/${endpoint}`).then(response => {
        if (!response.ok) throw new Error(`No se pudo cargar ${campo}`);
        return response.json();
      })
    );

    const datosArray = await Promise.all(fetchPromises);

    configs.forEach(({ campo, usarId }, index) => {
      const datos = datosArray[index];
      const modos = ["add", "edit"];

      modos.forEach((modo) => {
        const select = document.getElementById(`${modo}-${campo}-select`);
        if (!select) return;

        select.innerHTML = `<option value="">Selecciona una opción</option>`;

        datos.forEach((item) => {
          const option = document.createElement("option");
          option.value = usarId ? item._id : item.Nombre || item;
          option.textContent = item.Nombre || item;
          select.appendChild(option);
        });

        // ➕ Opción para escribir un nuevo valor manualmente
        const optionOtro = document.createElement("option");
        optionOtro.value = "nuevo";
        optionOtro.textContent = "Otro (escribir nuevo)";
        select.appendChild(optionOtro);
      });
    });
  } catch (err) {
    console.error("❌ Error cargando selects dinámicos:", err);
  }
}

// ==============================
// ✏️ EDICIÓN DE PRODUCTOS
// ==============================

// ✏️ Cargar los datos de un producto para editarlo en el modal
async function editarProducto(id) {
  try {
    const producto = await (await fetch(`${API_URL}/${id}`)).json();
    const precios = await (await fetch(`http://localhost:3000/api/precios`)).json();
    const descripcion = await (await fetch(`http://localhost:3000/api/descripcion/producto/${id}`)).json();
    const supermercados = await (await fetch(`http://localhost:3000/api/supermercados`)).json();
    const proveedores = await (await fetch(`http://localhost:3000/api/proveedor`)).json();

    const precioData = precios.find(p => p.producto_id === id) || {};
    const supermercado = supermercados.find(s => s._id === producto.Supermercado_id) || {};
    const proveedor = proveedores.find(p => p._id === producto.Proveedor_id) || {};

    console.log("📦 Producto cargado:", producto);

    // 📄 Asignar valores a los campos del formulario de edición
    safeSetValue("edit-producto-id", producto._id);
    safeSetValue("edit-nombre", producto.Nombre);
    safeSetValue("edit-marca-select", producto.Marca);
    safeSetValue("edit-peso", producto.Peso);
    safeSetValue("edit-unidadPeso", producto.UnidadPeso);
    safeSetValue("edit-estado", producto.Estado || "En stock");
    safeSetValue("edit-supermercado-select", supermercado._id);
    safeSetValue("edit-proveedor-select", proveedor._id);
    safeSetValue("edit-pais-proveedor", proveedor.Pais);
    safeSetValue("edit-fecha-subida", producto.fechaSubida);
    safeSetValue("edit-fecha-actualizacion", new Date().toISOString());
    safeSetValue("edit-usuario", producto.usuario);

    // 🧠 Descripción
    safeSetValue("edit-tipo-select", descripcion.Tipo || "Sin tipo");
    safeSetValue("edit-subtipo-select", descripcion.Subtipo || "Sin subtipo");
    safeSetValue("edit-utilidad", descripcion.Utilidad || "Sin descripción");
    safeSetValue("edit-ingredientes", (descripcion.Ingredientes || []).join(", "));

    // 💸 Precios
    safeSetValue("edit-precio", precioData.precioActual);
    safeSetValue("edit-precioDescuento", precioData.precioDescuento);
    safeSetValue("edit-unidadLote", precioData.unidadLote);
    safeSetValue("edit-precioPorUnidad", precioData.precioUnidadLote);

    const historial = (precioData.precioHistorico || [])
      .map(entry => `${entry.precio}, ${entry.año}`)
      .join("\n");
    safeSetValue("edit-precioHistorico", historial);

    // 📤 Mostrar el modal de edición
    document.getElementById("modal-editar").style.display = "flex";

  } catch (err) {
    console.error("❌ Error al cargar producto para editar:", err);
    Swal.fire("Error", "Hubo un problema al cargar el producto para edición.", "error");
  }
}

// ==============================
// 💾 GUARDAR PRODUCTO NUEVO
// ==============================

async function guardarProductoNuevo() {
  try {
    // 🐞 Depuración para verificar campos nulos
[
  "add-nombre",
  "add-marca-select",
  "add-tipo-select",
  "add-subtipo-select",
  "add-peso",
  "add-unidadPeso",
  "add-estado",
  "add-supermercado-select",
  "add-proveedor-select",
  "add-precio",
  "add-precioDescuento",
  "add-unidadLote",
  "add-precioPorUnidad",
  "add-utilidad",
  "add-ingredientes",
  "add-precioHistorico",
  "add-imagen"
].forEach(id => {
  const el = document.getElementById(id);
  if (!el) console.warn(`⚠️ Elemento NO encontrado: #${id}`);
});

    const formData = new FormData(); // 📦 Inicializamos el FormData para enviar multipart/form-data
    const ubicaciones = obtenerUbicacionesAdd(); // 📍 Recoger ubicaciones agregadas dinámicamente

    // ✅ Procesar posibles campos "nuevo" (marca, tipo, subtipo, proveedor, supermercado)
    const marca = await procesarCampoNuevo("add", "marca", insertarNuevaMarca);
    const tipo = await procesarCampoNuevo("add", "tipo", insertarNuevoTipo);
    const subtipo = await procesarCampoNuevo("add", "subtipo", insertarNuevoSubtipo);
    const proveedor = await procesarCampoNuevo("add", "proveedor", async (nombre) => {
      const pais = document.getElementById("add-pais-proveedor").value || "España";
      return await insertarNuevoProveedor(nombre, pais);
    });
    const supermercado = await procesarCampoNuevo("add", "supermercado", async (nombre) => {
      return await insertarNuevoSupermercado(nombre, ubicaciones);
    });

    // 🏷️ Asignar todos los campos al formData
    formData.append("nombre", document.getElementById("add-nombre").value);
    formData.append("marca", marca || "Sin marca");
    formData.append("tipo", tipo || "Sin tipo");
    formData.append("subtipo", subtipo || "Sin subtipo");
    formData.append("peso", document.getElementById("add-peso").value);
    formData.append("unidadPeso", document.getElementById("add-unidadPeso").value);
    formData.append("estado", document.getElementById("add-estado").value);
    formData.append("supermercado", supermercado);
    formData.append("proveedor", proveedor);
    formData.append("ubicaciones", JSON.stringify(ubicaciones));

    // 📝 Descripción extendida
    const utilidad = document.getElementById("add-utilidad").value.trim();
    formData.append("utilidad", utilidad || "Sin descripción");

    const ingredientesInput = document.getElementById("add-ingredientes").value;
    const ingredientesArray = ingredientesInput.split(",").map(i => i.trim()).filter(i => i.length > 0);
    formData.append("ingredientes", ingredientesArray.join(","));

    // 💰 Precios
    formData.append("precioActual", document.getElementById("add-precio").value);
    formData.append("precioDescuento", document.getElementById("add-precioDescuento")?.value || "");
    formData.append("unidadLote", document.getElementById("add-unidadLote")?.value || "N/A");
    formData.append("precioPorUnidad", document.getElementById("add-precioPorUnidad")?.value || "");

    // 📆 Fechas y usuario creador
    formData.append("fechaSubida", new Date().toISOString());
    formData.append("fechaActualizacion", new Date().toISOString());
    const usuario = JSON.parse(sessionStorage.getItem("user"));
    const userId = usuario?._id || usuario?.id;
    if (!userId) throw new Error("Usuario no autenticado");
    formData.append("usuario", userId);

    // 🖼️ Imagen del producto (si se proporciona)
    const imagenInput = document.getElementById("add-imagen");
    if (imagenInput?.files?.length > 0) {
      formData.append("Imagen", imagenInput.files[0]);
    }

    // 📈 Precio Histórico
    const precioHistoricoTexto = document.getElementById("add-precioHistorico")?.value || "";
    const precioHistoricoArray = precioHistoricoTexto.split('\n')
      .map(linea => {
        const [precio, año] = linea.split(',').map(e => e.trim());
        return { precio: parseFloat(precio), año: parseInt(año) };
      })
      .filter(e => !isNaN(e.precio) && !isNaN(e.año));
    formData.append("precioHistorico", JSON.stringify(precioHistoricoArray));

    // 🚀 Enviar datos al servidor
    const response = await fetch("http://localhost:3000/api/productos-completos", {
      method: "POST",
      body: formData
    });
    const responseText = await response.text();

  let result;
    
    
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error("❌ Respuesta no es JSON:", responseText);
      throw new Error("Respuesta no válida del servidor");
    }
        
    if (!response.ok || !result.producto_id) {
      console.warn(result);
      throw new Error("Error al crear producto");
    }
    

    // 🎉 Producto creado correctamente
    Swal.fire("✅ Éxito", "Producto creado correctamente", "success");
    cerrarFormularioAgregar();
    cargarProductos();

  } catch (err) {
    console.error("❌ Error guardando producto nuevo:", err);
    Swal.fire("Error", "No se pudo guardar el producto", "error");
  }
}

// ==============================
// 📝 GUARDAR CAMBIOS DESDE EL FORMULARIO DE EDICIÓN
// ==============================
async function guardarCambiosDesdeFormulario() {
  try {
    const id = document.getElementById("edit-producto-id").value;
    const formData = new FormData(); // 📦 Formulario para envío multipart
    const ubicaciones = obtenerUbicaciones(); // 📍 Captura dinámicamente las ubicaciones editadas

    // ✅ Procesar campos que pueden haber sido creados nuevos
    const marca = await procesarCampoNuevo("edit", "marca", insertarNuevaMarca);
    const tipo = await procesarCampoNuevo("edit", "tipo", insertarNuevoTipo);
    const subtipo = await procesarCampoNuevo("edit", "subtipo", insertarNuevoSubtipo);
    const proveedor = await procesarCampoNuevo("edit", "proveedor", insertarNuevoProveedor);
    const supermercadoNombre = await procesarCampoNuevo("edit", "supermercado", async (nombre) => {
      return await insertarNuevoSupermercado(nombre, ubicaciones);
    });

    // 🏷️ Campos básicos del producto
    formData.append("nombre", document.getElementById("edit-nombre").value);
    formData.append("marca", marca || "Sin marca");
    formData.append("peso", document.getElementById("edit-peso").value);
    formData.append("unidadPeso", document.getElementById("edit-unidadPeso").value);
    formData.append("estado", document.getElementById("edit-estado").value);
    formData.append("fechaActualizacion", new Date().toISOString());

    // 🧠 Información extendida
    formData.append("tipo", tipo || "Sin tipo");
    formData.append("subtipo", subtipo || "Sin subtipo");
    formData.append("utilidad", document.getElementById("edit-utilidad")?.value || "Sin descripción");
    formData.append("ubicaciones", JSON.stringify(ubicaciones));
    formData.append("ubicacion", document.getElementById("edit-ubicacion-super")?.value || "");
    formData.append("ciudad", document.getElementById("edit-ciudad-super")?.value || "");
    formData.append("paisSupermercado", document.getElementById("edit-pais-super")?.value || "España");
    formData.append("paisProveedor", document.getElementById("edit-pais-proveedor")?.value || "España");

    // 💰 Precios actualizados
    formData.append("precioActual", document.getElementById("edit-precio").value || "0");
    formData.append("precioDescuento", document.getElementById("edit-precioDescuento")?.value || "");
    formData.append("unidadLote", document.getElementById("edit-unidadLote")?.value || "");
    formData.append("precioPorUnidad", document.getElementById("edit-precioPorUnidad")?.value || "");

    // 🔗 Relaciones
    const usuario = JSON.parse(sessionStorage.getItem("user"));
    const userId = usuario?._id || usuario?.id;
    formData.append("usuario", userId);
    formData.append("proveedor", proveedor);
    formData.append("supermercado", supermercadoNombre);

    // 🥣 Ingredientes
    const ingredientesInput = document.getElementById("edit-ingredientes").value;
    const ingredientesArray = ingredientesInput.split(",").map(i => i.trim()).filter(i => i.length > 0);
    formData.append("ingredientes", ingredientesArray.join(","));

    // 🖼️ Imagen (opcional)
    const imagenInput = document.getElementById("edit-imagen");
    if (imagenInput?.files?.length > 0) {
      formData.append("Imagen", imagenInput.files[0]);
    }

    // 🚀 Enviar actualización al servidor
    const productoRes = await fetch(`http://localhost:3000/api/productos-completos/${id}`, {
      method: "PUT",
      body: formData,
    });
    if (!productoRes.ok) throw new Error("Error al actualizar el producto");

    // 🧾 Actualizar historial de precios
    const historialTexto = document.getElementById("edit-precioHistorico").value;
    let historialArray = [];

    if (historialTexto.includes('\n')) {
      historialArray = historialTexto.split('\n')
        .map(l => l.split(',').map(e => e.trim()))
        .filter(a => a.length === 2)
        .map(([precio, año]) => ({ precio: parseFloat(precio), año: parseInt(año) }));
    } else {
      const arr = historialTexto.split(',').map(e => e.trim());
      for (let i = 0; i < arr.length; i += 2) {
        if (arr[i + 1]) {
          historialArray.push({ precio: parseFloat(arr[i]), año: parseInt(arr[i + 1]) });
        }
      }
    }

    await fetch(`http://localhost:3000/api/precios/por-producto/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        producto_id: id,
        precioActual: parseFloat(document.getElementById("edit-precio").value),
        precioDescuento: document.getElementById("edit-precioDescuento").value || null,
        unidadLote: document.getElementById("edit-unidadLote").value || "N/A",
        precioUnidadLote: parseFloat(document.getElementById("edit-precioPorUnidad").value || "0"),
        precioHistorico: historialArray
      }),
    });

    // ✍️ Actualizar descripción
    await fetch("http://localhost:3000/api/descripcion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Producto_id: id,
        Tipo: tipo,
        Subtipo: subtipo,
        Utilidad: document.getElementById("edit-utilidad").value || "Sin descripción"
      }),
    });

    // 🎉 Confirmación de éxito
    Swal.fire("✅ Éxito", "Producto actualizado completamente", "success");
    cerrarFormulario();
    cargarProductos();

  } catch (err) {
    console.error("❌ Error al actualizar producto completo:", err);
    Swal.fire("Error", "Hubo un problema al actualizar el producto.", "error");
  }
}

// ==============================
// ➕ CREACIÓN DE NUEVO SUPERMERCADO
// ==============================
async function insertarNuevoSupermercado(nombre, ubicacionesArray) {
  const res = await fetch("http://localhost:3000/api/supermercados", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      Nombre: nombre,
      Ubicaciones: ubicacionesArray // Array de ubicaciones asociadas
    })
  });

  if (!res.ok) throw new Error("Error al crear supermercado");

  const data = await res.json();
  return data.supermercado._id; // Retorna el ID del nuevo supermercado para usarlo en el formulario
}

// ==============================
// ➕ CREACIÓN DE NUEVO PROVEEDOR
// ==============================
async function insertarNuevoProveedor(nombre, pais, comunidad = "N/A") {
  const res = await fetch("http://localhost:3000/api/proveedor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      Nombre: nombre,
      Pais: pais,
      "C.Autonoma": comunidad
    })
  });

  if (!res.ok) throw new Error("Error al crear proveedor");

  const data = await res.json();
  return data.proveedor._id; // Retorna el ID para asociarlo al producto
}

// ==============================
// ➕ CREACIÓN DE NUEVA MARCA
// ==============================
async function insertarNuevaMarca(nombre) {
  const res = await fetch("http://localhost:3000/api/marcas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ Nombre: nombre })
  });

  if (!res.ok) throw new Error("Error al crear marca");

  const data = await res.json();
  return data.marca?.Nombre || nombre; // O retorna _id si así lo maneja tu backend
}

// ==============================
// ➕ CREACIÓN DE NUEVO TIPO
// ==============================
async function insertarNuevoTipo(nombre) {
  const res = await fetch("http://localhost:3000/api/tipos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ Nombre: nombre })
  });

  if (!res.ok) throw new Error("Error al crear tipo");

  const data = await res.json();
  return data.tipo?.Nombre || nombre; // O data.tipo._id si el backend responde con ID
}

// ==============================
// ➕ CREACIÓN DE NUEVO SUBTIPO
// ==============================
async function insertarNuevoSubtipo(nombre) {
  const res = await fetch("http://localhost:3000/api/subtipos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ Nombre: nombre })
  });

  if (!res.ok) throw new Error("Error al crear subtipo");

  const data = await res.json();
  return data.subtipo?.Nombre || nombre;
}

// ==============================
// 🎛️ PROCESAR CAMPOS QUE PUEDEN SER NUEVOS
// ==============================
// Este método detecta si el usuario ha seleccionado "Otro (escribir nuevo)" en un select
// Si es así, inserta el nuevo dato en la base de datos y devuelve el ID o valor correspondiente
async function procesarCampoNuevo(modo, campo, insertFn) {
  const select = document.getElementById(`${modo}-${campo}-select`);
  let valor = select?.value || "";

  if (valor === "nuevo") {
    const input = document.getElementById(`${modo}-${campo}-nuevo`);
    if (!input) throw new Error(`Campo nuevo para ${campo} no encontrado`);
    const nuevoValor = input.value.trim();
    if (!nuevoValor) throw new Error(`Debes ingresar un nuevo valor para ${campo}`);
    valor = await insertFn(nuevoValor); // Inserta y recupera el valor o ID
  }

  return valor;
}

// ==============================
// ➕ AÑADIR UN NUEVO GRUPO DE CAMPOS DE UBICACIÓN
// ==============================
function agregarUbicacion() {
  const contenedor = document.getElementById("ubicaciones-container");
  const div = document.createElement("div");
  div.className = "ubicacion-grupo"; // Se crea una sección de inputs para Ubicación, Ciudad y País
  div.innerHTML = `
    <input type="text" class="ubicacion" placeholder="Ubicación (ej: Calle Mayor 45)" />
    <input type="text" class="ciudad" placeholder="Ciudad (ej: Madrid)" />
    <input type="text" class="pais" placeholder="País (ej: España)" value="España" />
    <button type="button" onclick="eliminarUbicacion(this)">❌</button>
  `;
  contenedor.appendChild(div);
}

function agregarUbicacionAdd() {
  const contenedor = document.getElementById("ubicaciones-container-add");
  const div = document.createElement("div");
  div.className = "ubicacion-grupo";
  div.innerHTML = `
    <input type="text" class="ubicacion" placeholder="Ubicación (ej: Calle Mayor 45)" />
    <input type="text" class="ciudad" placeholder="Ciudad (ej: Madrid)" />
    <input type="text" class="pais" placeholder="País (ej: España)" value="España" />
    <button type="button" onclick="eliminarUbicacion(this)">❌</button>
  `;
  contenedor.appendChild(div);
}

function obtenerUbicacionesAdd() {
  const contenedor = document.getElementById("ubicaciones-container-add");
  const grupos = contenedor.querySelectorAll(".ubicacion-grupo");

  const ubicaciones = [];

  grupos.forEach(grupo => {
    const ubicacion = grupo.querySelector(".ubicacion")?.value.trim() || "";
    const ciudad = grupo.querySelector(".ciudad")?.value.trim() || "";
    const pais = grupo.querySelector(".pais")?.value.trim() || "España";

    if (ubicacion || ciudad || pais) {
      ubicaciones.push({ ubicacion, ciudad, pais });
    }
  });

  return ubicaciones;
}
function obtenerUbicaciones() {
  const contenedor = document.getElementById("ubicaciones-container");
  const grupos = contenedor.querySelectorAll(".ubicacion-grupo");

  const ubicaciones = [];

  grupos.forEach(grupo => {
    const ubicacion = grupo.querySelector(".ubicacion")?.value.trim() || "";
    const ciudad = grupo.querySelector(".ciudad")?.value.trim() || "";
    const pais = grupo.querySelector(".pais")?.value.trim() || "España";

    if (ubicacion || ciudad || pais) {
      ubicaciones.push({ ubicacion, ciudad, pais });
    }
  });

  return ubicaciones;
}

// ==============================
// 🗑️ ELIMINAR UN GRUPO DE CAMPOS DE UBICACIÓN
// ==============================
function eliminarUbicacion(btn) {
  btn.parentElement.remove(); // Borra el contenedor asociado al botón
}

// ==============================
// 🎯 FUNCIÓN SEGURA PARA ASIGNAR VALOR A INPUTS
// ==============================
// Evita errores si un input no existe
function safeSetValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value ?? "";
  else console.warn(`⚠️ Campo no encontrado: #${id}`);
}

// ==============================
// 🧩 TOGGLE ENTRE SELECT EXISTENTE E INPUT NUEVO
// ==============================
function toggleNuevoCampo(modo, campo) {
  const select = document.getElementById(`${modo}-${campo}-select`);
  const input = document.getElementById(`${modo}-${campo}-nuevo`);
  if (!select || !input) return;

  const esNuevo = select.value === "nuevo";
  input.style.display = esNuevo ? "block" : "none"; // Muestra el input solo si eligen "nuevo"
  input.required = esNuevo;
  if (!esNuevo) input.value = ""; // Resetea si cambia
}

// ==============================
// 🧹 CERRAR Y LIMPIAR FORMULARIO DE EDICIÓN
// ==============================
function cerrarFormulario() {
  const form = document.getElementById("form-editar-producto");
  if (form) form.reset();
  document.getElementById("modal-editar").style.display = "none";
  document.getElementById("ubicaciones-container").innerHTML = ""; // 🔥 Limpia dinámicamente las ubicaciones
}

// ==============================
// 🧹 CERRAR Y LIMPIAR FORMULARIO DE AGREGADO
// ==============================
function cerrarFormularioAgregar() {
  const form = document.getElementById("form-agregar-producto");
  if (form) form.reset();
  document.getElementById("modal-agregar").style.display = "none";
  document.getElementById("ubicaciones-container-add").innerHTML = ""; // 🔥 Limpia dinámicamente las ubicaciones
}

// ==============================
// ➕ ABRIR FORMULARIO DE AGREGAR PRODUCTO
// ==============================
function mostrarFormularioAgregar() {
  document.getElementById("modal-agregar").style.display = "flex"; // 📜 Abre el modal de agregar
}

// ==============================
// 🗑️ ELIMINAR UN PRODUCTO DEL SISTEMA
// ==============================
async function eliminarProducto(id) {
  try {
    const confirm = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    const res = await fetch(`http://localhost:3000/api/productos-completos/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) throw new Error("Error al eliminar producto completo");

    Swal.fire("✅ Eliminado", "Producto eliminado correctamente", "success");
    cargarProductos();
  } catch (err) {
    console.error("❌ Error al eliminar producto:", err);
    Swal.fire("Error", "Hubo un problema al eliminar el producto.", "error");
  }
}

// ==============================
// 🌍 FUNCIONES EXPUESTAS A NIVEL GLOBAL PARA HTML
// ==============================
window.toggleNuevoCampo = toggleNuevoCampo;
window.cargarOpcionesEnSelects = cargarOpcionesEnSelects;
window.guardarProductoNuevo = guardarProductoNuevo;
window.guardarCambiosDesdeFormulario = guardarCambiosDesdeFormulario;
window.cerrarFormularioAgregar = cerrarFormularioAgregar;
window.cerrarFormulario = cerrarFormulario;
window.editarProducto = editarProducto;
window.eliminarProducto = eliminarProducto;
window.mostrarFormularioAgregar = mostrarFormularioAgregar;
window.agregarUbicacion = agregarUbicacion;
window.eliminarUbicacion = eliminarUbicacion;
window.agregarUbicacionAdd = agregarUbicacionAdd;
