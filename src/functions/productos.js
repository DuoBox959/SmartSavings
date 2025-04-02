import { cargarHeaderFooter } from "../functions/global/funciones.js";
import { gestionarUsuarioAutenticado } from "../functions/global/header.js";
import { volverAtras } from "../functions/global/funciones.js";

window.volverAtras = volverAtras;

const API_URL = "http://localhost:3000/api/productos"; 

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await cargarHeaderFooter();
    gestionarUsuarioAutenticado();
    await cargarSupermercadosEnSelects();
    cargarProductos();
  } catch (error) {
    console.error("Error en la inicialización:", error);
  }
});

async function cargarProductos() {
  try {
    const productosContainer = document.getElementById("productos-container");
    productosContainer.innerHTML = ""; // Limpiar antes de actualizar

    const response = await fetch(API_URL);
    const productos = await response.json();

    productos.forEach((producto) => {
      const productoHTML = `
        <div class="product-card">
        <img src="${producto.Imagen || '../assets/img/default.webp'}" alt="${producto.Nombre}">

            <h3>${producto.Nombre}</h3>
            <p class="marca">${producto.Marca || "Marca desconocida"}</p>
            <p class="peso">Peso: ${producto.Peso} ${producto.UnidadPeso}</p>
            <p class="estado">Estado: ${producto.Estado}</p>
            <div class="acciones">
                <button class="btn-editar" onclick="editarProducto('${
                  producto._id
                }')">✏️ Editar</button>
                <button class="btn-eliminar" onclick="eliminarProducto('${
                  producto._id
                }')">🗑️ Eliminar</button>
            </div>
        </div>
      `;
      productosContainer.innerHTML += productoHTML;
    });
  } catch (err) {
    console.error("Error cargando productos:", err);
  }
}
function safeSetValue(id, value) {
  const el = document.getElementById(id);
  if (el) {
    el.value = value ?? "";
  } else {
    console.warn(`⚠️ Campo no encontrado: #${id}`);
  }
}

async function editarProducto(id) {
  try {
    const responseProducto = await fetch(`${API_URL}/${id}`);
    if (!responseProducto.ok) throw new Error("Producto no encontrado");
    const producto = await responseProducto.json();

    const responsePrecios = await fetch(`http://localhost:3000/api/precios`);
    const precios = await responsePrecios.json();
    const precioData = precios.find((p) => p.producto_id === id) || {};

    const responseSupermercados = await fetch(`http://localhost:3000/api/supermercados`);
    const supermercados = await responseSupermercados.json();
    const supermercado = supermercados.find((s) => s._id === producto.Supermercado_id) || {};

    let proveedor = {};
    try {
      const responseProveedores = await fetch(`http://localhost:3000/api/proveedor`);
      if (responseProveedores.ok) {
        const proveedores = await responseProveedores.json();
        proveedor = proveedores.find((p) => p._id === producto.Proveedor_id) || {};
      }
    } catch (err) {
      console.error("No se pudo cargar los proveedores", err);
    }

    // ✅ Usamos safeSetValue para evitar errores si falta algún input
    safeSetValue("edit-producto-id", producto._id);
    safeSetValue("edit-nombre", producto.Nombre);
    safeSetValue("edit-marca", producto.Marca);
    safeSetValue("edit-tipo", producto.Tipo);
    safeSetValue("edit-subtipo", producto.Subtipo);
    safeSetValue("edit-precio", precioData.precioActual);
    safeSetValue("edit-precioDescuento", precioData.precioDescuento);
    safeSetValue("edit-peso", producto.Peso);
    safeSetValue("edit-unidadPeso", producto.UnidadPeso?.toLowerCase());
    safeSetValue("edit-supermercado", supermercado.Nombre);
    safeSetValue("edit-ubicacion-super", supermercado.Ubicacion);
    safeSetValue("edit-pais-super", supermercado.Pais);
    safeSetValue("edit-proveedor", proveedor.Nombre);
    safeSetValue("edit-pais-proveedor", proveedor.Pais);
    safeSetValue("edit-unidadLote", precioData.unidadLote);
    safeSetValue("edit-precioPorUnidad", precioData.precioPorUnidad);

    const estadoNormalizado = producto.Estado?.trim().toLowerCase() === "sin stock" ? "Sin stock" : "En stock";
    safeSetValue("edit-estado", estadoNormalizado);

    safeSetValue("edit-fecha-subida", producto.fechaSubida);
    safeSetValue("edit-fecha-actualizacion", new Date().toISOString());
    safeSetValue("edit-usuario", producto.usuario);

    // Historial de precios
    const historial = (producto.Historico || [])
      .map(entry => `${entry.fecha} - ${entry.precio}€`)
      .join("\n");
    safeSetValue("edit-precioHistorico", historial);

    document.getElementById("modal-editar").style.display = "flex";
  } catch (err) {
    console.error("Error al cargar el producto para edición:", err);
    Swal.fire("Error", "Hubo un problema al cargar el producto para edición.", "error");
  }
}

async function guardarCambiosDesdeFormulario() {
  try {
    const id = document.getElementById("edit-producto-id").value;

    const formData = new FormData();
    formData.append("nombre", document.getElementById("edit-nombre").value);
    formData.append("marca", document.getElementById("edit-marca").value || "Sin marca"); // 💡 AÑADIDO
    formData.append("peso", document.getElementById("edit-peso").value);
    formData.append("unidadPeso", document.getElementById("edit-unidadPeso").value);
    formData.append("estado", document.getElementById("edit-estado").value);

    const proveedor = document.getElementById("edit-proveedor").value;
    if (proveedor) formData.append("proveedor_id", proveedor);

    const supermercado = document.getElementById("edit-supermercado").value;
    if (supermercado) formData.append("supermercado_id", supermercado);

    const response = await fetch(`http://localhost:3000/api/productos-completos/${id}`, {
      method: "PUT",
      body: formData,
    });

    if (!response.ok) throw new Error("Error en la actualización");

    Swal.fire("Éxito", "Producto actualizado correctamente", "success");
    cerrarFormulario();
    cargarProductos();
  } catch (err) {
    console.error("Error al guardar cambios:", err);
    Swal.fire("Error", "Hubo un problema al actualizar el producto.", "error");
  }
}

async function guardarProductoNuevo() {
  try {
    const formData = new FormData();

    // 🏷️ Campos obligatorios u opcionales con default
    formData.append("nombre", document.getElementById("add-nombre")?.value || "N/A");
    formData.append("marca", document.getElementById("add-marca")?.value || "Sin marca"); // 💡 AÑADIDO
    formData.append("tipo", document.getElementById("add-tipo")?.value || "N/A");
    formData.append("subtipo", document.getElementById("add-subtipo")?.value || "");
    formData.append("utilidad", document.getElementById("add-utilidad")?.value || "");
    formData.append("precioActual", document.getElementById("add-precio")?.value || "0");
    formData.append("precioDescuento", document.getElementById("add-precioDescuento")?.value || "");
    formData.append("peso", document.getElementById("add-peso")?.value || "0");
    formData.append("unidadPeso", document.getElementById("add-unidadPeso")?.value || "N/A");
    formData.append("estado", document.getElementById("add-estado")?.value || "En stock");

    // 🖼️ Imagen (solo si hay archivo seleccionado)
    const imagenInput = document.getElementById("add-imagen");
    if (imagenInput?.files?.length > 0) {
      formData.append("Imagen", imagenInput.files[0]);
    }

    // 📦 Supermercado y proveedor (IDs o nombres, según backend)
    let supermercadoSeleccionado = document.getElementById("add-supermercado-select").value;
    if (supermercadoSeleccionado === "nuevo") {
      supermercadoSeleccionado = document.getElementById("add-supermercado-nuevo").value;
    }
    formData.append("supermercado", supermercadoSeleccionado || "");
        formData.append("proveedor", document.getElementById("add-proveedor")?.value || "");

    // 🧾 Campos adicionales
    formData.append("paisSuper", document.getElementById("add-pais-super")?.value || "");
    formData.append("paisProveedor", document.getElementById("add-pais-proveedor")?.value || "");
    formData.append("unidadLote", document.getElementById("add-unidadLote")?.value || "N/A");
    formData.append("precioPorUnidad", document.getElementById("add-precioPorUnidad")?.value || "");
    formData.append("precioHistorico", document.getElementById("add-precioHistorico")?.value || "");

    // 👤 Usuario (desde localStorage)
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    const userId = usuario?._id || usuario?.id || usuario?.Id || null;

    if (!userId || typeof userId !== "string") {
      console.warn("🧨 Usuario mal definido en localStorage:", usuario);
      throw new Error("Usuario no identificado");
    }
    formData.append("usuario", userId);

    

    // 🕒 Fechas
    formData.append("fechaSubida", new Date().toISOString());
    formData.append("fechaActualizacion", new Date().toISOString());

    // 📡 Enviar al backend
    const response = await fetch("http://localhost:3000/api/productos-completos", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error("Error al guardar el producto completo. Respuesta del servidor: " + errorText);
    }

    Swal.fire("✅ Éxito", "Producto agregado correctamente", "success");
    cerrarFormularioAgregar();
    cargarProductos();
  } catch (err) {
    console.error("❌ Error al guardar producto completo:", err);
    Swal.fire("Error", "Hubo un problema al guardar el producto completo.", "error");
  }
}


function cerrarFormularioAgregar() {
  document.getElementById("modal-agregar").style.display = "none";
}

function cerrarFormulario() {
  document.getElementById("modal-editar").style.display = "none";
}
function mostrarFormularioAgregar() {
  document.getElementById("modal-agregar").style.display = "flex";
}

async function eliminarProducto(id) {
  try {
    const resultado = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!resultado.isConfirmed) return;

    await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    Swal.fire("Eliminado", "El producto ha sido eliminado.", "success");
    cargarProductos();
  } catch (err) {
    console.error("Error al eliminar el producto:", err);
    Swal.fire("Error", "Hubo un problema al eliminar el producto.", "error");
  }
}
async function cargarSupermercadosEnSelects() {
  try {
    const response = await fetch("http://localhost:3000/api/supermercados");
    const supermercados = await response.json();

    const selects = ["add-supermercado-select", "edit-supermercado-select"];
    selects.forEach(selectId => {
      const select = document.getElementById(selectId);
      select.innerHTML = `<option value="">Selecciona un supermercado</option>`;

      supermercados.forEach(supermercado => {
        const option = document.createElement("option");
        option.value = supermercado._id;
        option.textContent = supermercado.Nombre;
        select.appendChild(option);
      });

      const optionOtro = document.createElement("option");
      optionOtro.value = "nuevo";
      optionOtro.textContent = "Otro (escribir nuevo)";
      select.appendChild(optionOtro);
    });
  } catch (err) {
    console.error("Error cargando supermercados:", err);
  }
}

function toggleNuevoSupermercado(tipo) {
  const select = document.getElementById(`${tipo}-supermercado-select`);
  const inputNuevo = document.getElementById(`${tipo}-supermercado-nuevo`);

  if (select.value === "nuevo") {
    inputNuevo.style.display = "block";
    inputNuevo.required = true;
  } else {
    inputNuevo.style.display = "none";
    inputNuevo.required = false;
    inputNuevo.value = ""; 
  }
}
window.toggleNuevoSupermercado = toggleNuevoSupermercado;
window.cargarSupermercadosEnSelects = cargarSupermercadosEnSelects;
window.guardarProductoNuevo = guardarProductoNuevo;
window.cerrarFormularioAgregar = cerrarFormularioAgregar;
window.guardarCambiosDesdeFormulario = guardarCambiosDesdeFormulario;
window.cerrarFormulario = cerrarFormulario;
window.editarProducto = editarProducto;
window.eliminarProducto = eliminarProducto;
window.mostrarFormularioAgregar = mostrarFormularioAgregar;
