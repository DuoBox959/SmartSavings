// ==============================
// 📦 IMPORTACIONES
// ==============================
import { cargarHeaderFooter, volverAtras } from "../functions/global/funciones.js";
import { gestionarUsuarioAutenticado } from "../functions/global/header.js";

window.volverAtras = volverAtras;

const API_URL = "http://localhost:3000/api/productos";

// ==============================
// 🚀 INICIALIZACIÓN AL CARGAR
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
    gestionarUsuarioAutenticado();
    await cargarOpcionesEnSelects([
      { campo: "supermercado", endpoint: "supermercados", usarId: true },
      { campo: "tipo", endpoint: "tipos", usarId: false },
      { campo: "subtipo", endpoint: "subtipos", usarId: false },
      { campo: "marca", endpoint: "marcas", usarId: false },
      { campo: "proveedor", endpoint: "proveedores", usarId: true },
    ]);
    cargarProductos();
  } catch (error) {
    console.error("Error en la inicialización:", error);
  }
});

// ==============================
// 📥 FUNCIONES DE CARGA Y LISTADO
// ==============================
async function cargarProductos() {
  try {
    const productosContainer = document.getElementById("productos-container");
    productosContainer.innerHTML = ""; // Limpiar antes de mostrar

    const response = await fetch(API_URL);
    const productos = await response.json();

    productos.forEach((producto) => {
      const productoHTML = `
      <div class="product-card">
        <a href="detalle-producto.html?id=${producto._id}">
          <img src="${producto.Imagen || '../assets/img/default.webp'}" alt="${producto.Nombre}">
          <h3>${producto.Nombre}</h3>
        </a>
          <div class="info-producto">
        <p class="marca">Marca: ${producto.Marca || "Marca desconocida"}</p>
        <p class="estado">Estado: ${producto.Estado}</p>
        <p class="peso">Peso: ${producto.Peso} ${producto.UnidadPeso}</p>
        <p class="precio">Precio: ${producto.precioActual ? producto.precioActual + " €" : "N/D"}</p>
        <p class="supermercado"> Supermercado: ${producto.Supermercado_id || "Desconocido"}</p>
        </div>


        <div class="acciones">
          <button class="btn-editar" onclick="editarProducto('${producto._id}')">✏️ Editar</button>
          <button class="btn-eliminar" onclick="eliminarProducto('${producto._id}')">🗑️ Eliminar</button>
        </div>
      </div>
    `;

      productosContainer.innerHTML += productoHTML;
    });
  } catch (err) {
    console.error("Error cargando productos:", err);
  }
}


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

        // Opción para insertar nuevo
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
async function editarProducto(id) {
  try {
    // 1. Obtener producto y datos relacionados
    const producto = await (await fetch(`${API_URL}/${id}`)).json();
    const precios = await (await fetch(`http://localhost:3000/api/precios`)).json();
    const supermercados = await (await fetch(`http://localhost:3000/api/supermercados`)).json();
    const proveedores = await (await fetch(`http://localhost:3000/api/proveedor`)).json();

    const precioData = precios.find(p => p.producto_id === id) || {};
    const supermercado = supermercados.find(s => s._id === producto.Supermercado_id) || {};
    const proveedor = proveedores.find(p => p._id === producto.Proveedor_id) || {};
    console.log("📦 Producto cargado:", producto);

    // 2. Cargar en formulario
    safeSetValue("edit-producto-id", producto._id);
    safeSetValue("edit-nombre", producto.Nombre);
    safeSetValue("edit-marca-select", producto.Marca);
    safeSetValue("edit-tipo-select", producto.Tipo);
    safeSetValue("edit-subtipo-select", producto.Subtipo);
    safeSetValue("edit-peso", producto.Peso);
    safeSetValue("edit-precio", precioData.precioActual);
    safeSetValue("edit-precioDescuento", precioData.precioDescuento);
    safeSetValue("edit-unidadLote", precioData.unidadLote);
    safeSetValue("edit-precioPorUnidad", precioData.precioPorUnidad);
    safeSetValue("edit-estado", producto.Estado || "En stock");
    safeSetValue("edit-supermercado-select", supermercado._id);
    safeSetValue("edit-ubicacion-super", supermercado.Ubicacion);
    safeSetValue("edit-pais-super", supermercado.Pais);
    safeSetValue("edit-proveedor-select", proveedor._id);
    safeSetValue("edit-pais-proveedor", proveedor.Pais);
    safeSetValue("edit-fecha-subida", producto.fechaSubida);
    safeSetValue("edit-fecha-actualizacion", new Date().toISOString());
    safeSetValue("edit-usuario", producto.usuario);

    // 🧠 Historial visual en textarea
    const historial = (precioData.precioHistorico || [])
    .map(entry => `${entry.año || entry.fecha || "?"} - ${entry.precio}€`)
    .join("\n");
    safeSetValue("edit-precioHistorico", historial);

    document.getElementById("modal-editar").style.display = "flex";
  } catch (err) {
    console.error("❌ Error al cargar producto para editar:", err);
    Swal.fire("Error", "Hubo un problema al cargar el producto para edición.", "error");
  }

}

// ==============================
// 💾 GUARDAR PRODUCTO NUEVO / ACTUALIZADO
// ==============================
async function guardarProductoNuevo() {
  try {
    const formData = new FormData();

    // 🏷️ Nombre del producto
    formData.append("nombre", document.getElementById("add-nombre").value);

    // 🧠 Marca
    let marca = document.getElementById("add-marca-select").value;
    if (marca === "nuevo") {
      const nuevaMarca = document.getElementById("add-marca-nuevo").value.trim();
      marca = await insertarNuevaMarca(nuevaMarca);
    }
    formData.append("marca", marca || "Sin marca");

    // 🔠 Tipo
    let tipo = document.getElementById("add-tipo-select").value;
    if (tipo === "nuevo") {
      const nuevoTipo = document.getElementById("add-tipo-nuevo").value.trim();
      tipo = await insertarNuevoTipo(nuevoTipo);
    }
    formData.append("tipo", tipo || "Sin tipo");

    // 🔢 Subtipo
    let subtipo = document.getElementById("add-subtipo-select").value;
    if (subtipo === "nuevo") {
      const nuevoSubtipo = document.getElementById("add-subtipo-nuevo").value.trim();
      subtipo = await insertarNuevoSubtipo(nuevoSubtipo);
    }
    formData.append("subtipo", subtipo || "Sin subtipo");

    // 💰 Precios
    formData.append("precioActual", document.getElementById("add-precio").value);
    formData.append("precioDescuento", document.getElementById("add-precioDescuento")?.value || "");
    formData.append("unidadLote", document.getElementById("add-unidadLote")?.value || "N/A");
    formData.append("precioPorUnidad", document.getElementById("add-precioPorUnidad")?.value || "");

    // ⚖️ Peso
    formData.append("peso", document.getElementById("add-peso").value);
    formData.append("unidadPeso", document.getElementById("add-unidadPeso").value);

    // 🏷️ Estado
    formData.append("estado", document.getElementById("add-estado").value);

    // 🧠 Precio histórico
    formData.append("precioHistorico", document.getElementById("add-precioHistorico")?.value || "");

    // 🖼️ Imagen
    const imagenInput = document.getElementById("add-imagen");
    if (imagenInput?.files?.length > 0) {
      formData.append("Imagen", imagenInput.files[0]);
    }

    // 🏬 Supermercado
    let supermercadoId = document.getElementById("add-supermercado-select").value;
    if (supermercadoId === "nuevo") {
      const nuevoNombre = document.getElementById("add-supermercado-nuevo").value;
      const nuevoPais = document.getElementById("add-pais-super").value || "España";
      const nuevaUbicacion = document.getElementById("add-ubicacion-super").value || "";
      const nuevaCiudad = document.getElementById("add-ciudad-super").value || "N/A";
      supermercadoId = await insertarNuevoSupermercado(nuevoNombre, nuevoPais, nuevaUbicacion, nuevaCiudad);
    }
    formData.append("supermercado", supermercadoId);

    // 🚚 Proveedor
    let proveedorId = document.getElementById("add-proveedor-select").value;
    if (proveedorId === "nuevo") {
      const nuevoNombre = document.getElementById("add-proveedor-nuevo").value;
      const nuevoPais = document.getElementById("add-pais-proveedor").value || "España";
      proveedorId = await insertarNuevoProveedor(nuevoNombre, nuevoPais);
    }
    formData.append("proveedor", proveedorId);

    // 📅 Fechas y usuario
    formData.append("fechaSubida", new Date().toISOString());
    formData.append("fechaActualizacion", new Date().toISOString());

    // 📝 Utilidad
    const utilidad = document.getElementById("add-utilidad").value.trim();
    formData.append("utilidad", utilidad || "Sin descripción");

    // 🥣 Ingredientes
    const ingredientesInput = document.getElementById("add-ingredientes").value;
    const ingredientesArray = ingredientesInput
      .split(",")
      .map(i => i.trim())
      .filter(i => i.length > 0);
    formData.append("ingredientes", ingredientesArray.join(","));

    // 👤 Usuario
    const usuario = JSON.parse(sessionStorage.getItem("user"));
    const userId = usuario?._id || usuario?.id;
    if (!userId) throw new Error("Usuario no autenticado");
    formData.append("usuario", userId);
    
    console.log("📦 FormData enviado al backend:");
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }
    
    // 🚀 Enviar al backend
    const response = await fetch("http://localhost:3000/api/productos-completos", {
      method: "POST",
      body: formData
    });

    const result = await response.json();

    if (!response.ok || !result.producto_id) {
      console.warn(result);
      throw new Error("Error al crear producto");
    }

    // 🎉 Éxito
    Swal.fire("✅ Éxito", "Producto creado correctamente", "success");
    cerrarFormularioAgregar();
    cargarProductos();

  } catch (err) {
    console.error("❌ Error guardando producto nuevo:", err);
    Swal.fire("Error", "No se pudo guardar el producto", "error");
  }
}


async function guardarCambiosDesdeFormulario() {
  try {
    const id = document.getElementById("edit-producto-id").value;
    const formData = new FormData();

    // 🧱 Campos base
    formData.append("nombre", document.getElementById("edit-nombre").value);
    formData.append("marca", document.getElementById("edit-marca-select").value || "Sin marca");
    formData.append("peso", document.getElementById("edit-peso").value);
    formData.append("unidadPeso", document.getElementById("edit-unidadPeso").value);
    formData.append("estado", document.getElementById("edit-estado").value);
    formData.append("fechaActualizacion", new Date().toISOString());

    // 🔗 IDs relacionados
    const supermercadoId = document.getElementById("edit-supermercado-select").value;
    const proveedorId = document.getElementById("edit-proveedor-select").value;
    const userId = JSON.parse(localStorage.getItem("usuario"))?._id;

    formData.append("supermercado", supermercadoId);
    formData.append("proveedor", proveedorId);
    formData.append("usuario", userId);

    // 🖼️ Imagen opcional
    const imagenInput = document.getElementById("edit-imagen");
    if (imagenInput?.files?.length > 0) {
      formData.append("Imagen", imagenInput.files[0]);
    }

    // 🔄 1️⃣ Actualizar producto principal
    const productoRes = await fetch(`http://localhost:3000/api/productos-completos/${id}`, {
      method: "PUT",
      body: formData,
    });

    if (!productoRes.ok) throw new Error("Error al actualizar el producto");

    // 💸 2️⃣ Preparar precio histórico desde texto
    const historialTexto = document.getElementById("edit-precioHistorico").value;
    const historialArray = historialTexto
      .split(',')
      .map(e => e.trim())
      .reduce((acc, val, idx, arr) => {
        if (idx % 2 === 0 && arr[idx + 1]) {
          acc.push({
            precio: parseFloat(val),
            año: parseInt(arr[idx + 1])
          });
        }
        return acc;
      }, []);

    // 💰 3️⃣ Actualizar precio
    const precioData = {
      producto_id: id,
      precioActual: parseFloat(document.getElementById("edit-precio").value),
      precioDescuento: document.getElementById("edit-precioDescuento").value || null,
      unidadLote: document.getElementById("edit-unidadLote").value || "N/A",
      precioUnidadLote: parseFloat(document.getElementById("edit-precioPorUnidad").value || "0"),
      precioHistorico: historialArray
    };

    await fetch("http://localhost:3000/api/precios", {
      method: "POST", // Usa PUT si ya lo tienes creado
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(precioData),
    });

    // 📝 4️⃣ Actualizar descripción con Utilidad incluida
    const descripcionData = {
      Producto_id: id,
      Tipo: document.getElementById("edit-tipo-select").value,
      Subtipo: document.getElementById("edit-subtipo-select").value,
      Utilidad: document.getElementById("edit-utilidad").value || "Sin descripción"
    };

    await fetch("http://localhost:3000/api/descripcion", {
      method: "POST", // Usa PUT si ya existe
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(descripcionData),
    });

    // 🎉 Éxito
    Swal.fire("✅ Éxito", "Producto actualizado completamente", "success");
    cerrarFormulario();
    cargarProductos(); // Asegúrate de que esta función existe, si no, usa cargarProducto()

  } catch (err) {
    console.error("❌ Error al actualizar producto completo:", err);
    Swal.fire("Error", "Hubo un problema al actualizar el producto.", "error");
  }
}



// ==============================
// ➕ CREACIÓN DE RELACIONES DINÁMICAS
// ==============================
async function insertarNuevoSupermercado(nombre, pais, ubicacion = "", ciudad = "N/A") {
  const res = await fetch("http://localhost:3000/api/supermercados", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      Nombre: nombre,
      Pais: pais,
      Ciudad: ciudad,
      Ubicacion: [ubicacion]
    })
  });

  if (!res.ok) throw new Error("Error al crear supermercado");

  const data = await res.json();
  return data.supermercado._id;
}


async function insertarNuevoProveedor(nombre, pais, comunidad = "N/A") {
  const res = await fetch("http://localhost:3000/api/proveedor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ Nombre: nombre, Pais: pais, "C.Autonoma": comunidad })
  });

  if (!res.ok) throw new Error("Error al crear proveedor");
  const data = await res.json();
  return data.proveedor._id;
}

// ==============================
// 🧠 UTILIDADES Y FORMULARIO
// ==============================
async function insertarNuevaMarca(nombre) {
  return nombre;
}

async function insertarNuevoTipo(tipo) {
  return tipo;
}

async function insertarNuevoSubtipo(subtipo) {
  return subtipo;
}

function safeSetValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value ?? "";
  else console.warn(`⚠️ Campo no encontrado: #${id}`);
}

function toggleNuevoCampo(modo, campo) {
  const select = document.getElementById(`${modo}-${campo}-select`);
  const input = document.getElementById(`${modo}-${campo}-nuevo`);
  if (!select || !input) return;

  const esNuevo = select.value === "nuevo";
  input.style.display = esNuevo ? "block" : "none";
  input.required = esNuevo;
  if (!esNuevo) input.value = "";
}

function cerrarFormulario() {
  const form = document.getElementById("form-editar");
  if (form) form.reset();
  document.getElementById("modal-editar").style.display = "none";
}

function cerrarFormularioAgregar() {
  const form = document.getElementById("form-agregar");
  if (form) form.reset();
  document.getElementById("modal-agregar").style.display = "none";
}

function mostrarFormularioAgregar() {
  document.getElementById("modal-agregar").style.display = "flex";
}

// ==============================
// 🗑️ ELIMINACIÓN DE PRODUCTO
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

    // 🧨 Elimina todo desde tu endpoint central
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
// 🔁 EXPOSICIÓN GLOBAL PARA HTML
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
