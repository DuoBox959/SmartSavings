import { cargarHeaderFooter } from "../functions/global/funciones.js";
import { gestionarUsuarioAutenticado } from "../functions/global/header.js";
import { volverAtras } from "../functions/global/funciones.js";

window.volverAtras = volverAtras;

const API_URL = "http://localhost:3000/api/productos"; // URL de la API

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await cargarHeaderFooter();
    gestionarUsuarioAutenticado();
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
            <img src="${producto.Imagen || "default.jpg"}" alt="${
        producto.Nombre
      }">
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

    // Rellenar formulario
    document.getElementById("edit-producto-id").value = producto._id;
    document.getElementById("edit-nombre").value = producto.Nombre;
    document.getElementById("edit-tipo").value = producto.Tipo || "";
    document.getElementById("edit-subtipo").value = producto.Subtipo || "";
    document.getElementById("edit-precio").value = precioData.precioActual || "";
    document.getElementById("edit-precioDescuento").value = precioData.precioDescuento || "";
    document.getElementById("edit-peso").value = producto.Peso;
    document.getElementById("edit-unidadPeso").value = producto.UnidadPeso.toLowerCase();
    document.getElementById("edit-imagen").value = producto.Imagen || "";

    document.getElementById("edit-supermercado").value = supermercado.Nombre || "";
    document.getElementById("edit-ubicacion-super").value = supermercado.Ubicacion || "";
    document.getElementById("edit-pais-super").value = supermercado.Pais || "";
    document.getElementById("edit-proveedor").value = proveedor.Nombre || "";
    document.getElementById("edit-pais-proveedor").value = proveedor.Pais || "";

    document.getElementById("edit-unidadLote").value = precioData.unidadLote || "";
    document.getElementById("edit-precioPorUnidad").value = precioData.precioPorUnidad || "";

    const estadoNormalizado = producto.Estado.trim().toLowerCase() === "sin stock" ? "Sin stock" : "En stock";
    document.getElementById("edit-estado").value = estadoNormalizado;

    // Campos ocultos
    document.getElementById("edit-fecha-subida").value = producto.fechaSubida || "";
    document.getElementById("edit-fecha-actualizacion").value = new Date().toISOString();
    document.getElementById("edit-usuario").value = producto.usuario || "";

    // Historial de precios
    document.getElementById("edit-precioHistorico").value = (producto.Historico || [])
      .map(entry => `${entry.fecha} - ${entry.precio}€`)
      .join("\n");

    document.getElementById("modal-editar").style.display = "flex";
  } catch (err) {
    console.error("Error al cargar el producto para edición:", err);
    Swal.fire("Error", "Hubo un problema al cargar el producto para edición.", "error");
  }
}
async function guardarCambiosDesdeFormulario() {
  try {
    const id = document.getElementById("edit-producto-id").value;

    // Crear FormData para enviar datos en formato adecuado al backend
    const formData = new FormData();
    formData.append("nombre", document.getElementById("edit-nombre").value);
    formData.append("marca", document.getElementById("edit-marca").value);
    formData.append("peso", document.getElementById("edit-peso").value);
    formData.append(
      "unidadPeso",
      document.getElementById("edit-unidadPeso").value
    );
    formData.append("estado", document.getElementById("edit-estado").value);

    // Solo incluir IDs válidos si existen
    const proveedor = document.getElementById("edit-proveedor").value;
    if (proveedor) formData.append("proveedor_id", proveedor);

    const supermercado = document.getElementById("edit-supermercado").value;
    if (supermercado) formData.append("supermercado_id", supermercado);

    // Enviar datos al servidor
    const response = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      body: formData, // ✅ Enviamos FormData en lugar de JSON
    });

    if (!response.ok) throw new Error("Error en la actualización");

    Swal.fire("Éxito", "Producto actualizado correctamente", "success");
    cerrarFormulario();
    cargarProductos(); // Recargar la lista de productos
  } catch (err) {
    console.error("Error al guardar cambios:", err);
    Swal.fire("Error", "Hubo un problema al actualizar el producto.", "error");
  }
}
async function guardarProductoNuevo() {
  try {
    const formData = new FormData();

    formData.append("nombre", document.getElementById("add-nombre").value);
    formData.append("tipo", document.getElementById("add-tipo").value);
    formData.append("subtipo", document.getElementById("add-subtipo").value);
    formData.append("precioActual", document.getElementById("add-precio").value);
    formData.append("precioDescuento", document.getElementById("add-precioDescuento").value);
    formData.append("peso", document.getElementById("add-peso").value);
    formData.append("unidadPeso", document.getElementById("add-unidadPeso").value);
    formData.append("imagen", document.getElementById("add-imagen").value);
    formData.append("estado", document.getElementById("add-estado").value);
    formData.append("ubicacionSuper", document.getElementById("add-ubicacion-super").value);
    formData.append("paisSuper", document.getElementById("add-pais-super").value);
    formData.append("proveedor", document.getElementById("add-proveedor").value);
    formData.append("paisProveedor", document.getElementById("add-pais-proveedor").value);
    formData.append("unidadLote", document.getElementById("add-unidadLote").value);
    formData.append("precioPorUnidad", document.getElementById("add-precioPorUnidad").value);
    formData.append("precioHistorico", document.getElementById("add-precioHistorico").value);

    // Fecha automática y usuario ficticio si no tienes autenticación
    formData.append("fechaSubida", new Date().toISOString());
    formData.append("fechaActualizacion", new Date().toISOString());
    formData.append("usuario", "admin");

    const response = await fetch(API_URL, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error("Error al guardar el producto");

    Swal.fire("Éxito", "Producto agregado correctamente", "success");
    cerrarFormularioAgregar();
    cargarProductos();
  } catch (err) {
    console.error("Error al guardar nuevo producto:", err);
    Swal.fire("Error", "Hubo un problema al agregar el producto.", "error");
  }
}
function cerrarFormularioAgregar() {
  document.getElementById("modal-agregar").style.display = "none";
}

function cerrarFormulario() {
  document.getElementById("modal-editar").style.display = "none";
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
window.guardarProductoNuevo = guardarProductoNuevo;
window.cerrarFormularioAgregar = cerrarFormularioAgregar;
window.guardarCambiosDesdeFormulario = guardarCambiosDesdeFormulario;
window.cerrarFormulario = cerrarFormulario;
window.editarProducto = editarProducto;
window.eliminarProducto = eliminarProducto;
