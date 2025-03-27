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
    // Obtener datos del producto
    const responseProducto = await fetch(`${API_URL}/${id}`);
    if (!responseProducto.ok) throw new Error("Producto no encontrado");
    const producto = await responseProducto.json();

    // Obtener todos los precios y filtrar por producto_id
    const responsePrecios = await fetch(`http://localhost:3000/api/precios`);
    const precios = await responsePrecios.json();
    const precioData = precios.find((p) => p.producto_id === id) || {};

    // Obtener todos los supermercados y filtrar por _id
    const responseSupermercados = await fetch(
      `http://localhost:3000/api/supermercados`
    );
    const supermercados = await responseSupermercados.json();
    const supermercado =
      supermercados.find((s) => s._id === producto.Supermercado_id) || {};

    // Obtener todos los proveedores y filtrar por _id
    let proveedor = {};
    try {
      const responseProveedores = await fetch(
        `http://localhost:3000/api/proveedor`
      );
      if (responseProveedores.ok) {
        const proveedores = await responseProveedores.json();
        proveedor =
          proveedores.find((p) => p._id === producto.Proveedor_id) || {};
      }
    } catch (err) {
      console.error("No se pudo cargar los proveedores", err);
    }

    // Asignar los valores al formulario de edición
    document.getElementById("edit-producto-id").value = producto._id;
    document.getElementById("edit-nombre").value = producto.Nombre;
    document.getElementById("edit-marca").value = producto.Marca;
    document.getElementById("edit-precio").value =
      precioData.precioActual || "";
    document.getElementById("edit-precioDescuento").value =
      precioData.precioDescuento || "";
    document.getElementById("edit-peso").value = producto.Peso;
    document.getElementById("edit-unidadPeso").value =
      producto.UnidadPeso.toLowerCase();

    // Asignar nombres de proveedor y supermercado en lugar de sus IDs
    document.getElementById("edit-proveedor").value =
      proveedor.Nombre || "Proveedor desconocido"; // Aquí asignamos el nombre
    document.getElementById("edit-supermercado").value =
      supermercado.Nombre || "Supermercado desconocido"; // Aquí asignamos el nombre

    document.getElementById("edit-ciudad").value = supermercado.Ciudad || "";

    // Normalizar el valor de "Estado" al cargar (convertirlo a "En stock" o "Sin stock")
    const estadoNormalizado =
      producto.Estado.trim().toLowerCase() === "sin stock"
        ? "Sin stock"
        : "En stock";
    document.getElementById("edit-estado").value = estadoNormalizado;

    document.getElementById("modal-editar").style.display = "flex";
  } catch (err) {
    console.error("Error al cargar el producto para edición:", err);
    Swal.fire(
      "Error",
      "Hubo un problema al cargar el producto para edición.",
      "error"
    );
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

window.guardarCambiosDesdeFormulario = guardarCambiosDesdeFormulario;
window.cerrarFormulario = cerrarFormulario;
window.editarProducto = editarProducto;
window.eliminarProducto = eliminarProducto;
