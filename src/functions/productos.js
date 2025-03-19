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
            <img src="${producto.Imagen || "default.jpg"}" alt="${producto.Nombre}">
            <h3>${producto.Nombre}</h3>
            <p class="marca">${producto.Marca || "Marca desconocida"}</p>
            <p class="peso">Peso: ${producto.Peso} ${producto.UnidadPeso}</p>
            <p class="estado">Estado: ${producto.Estado}</p>
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

async function editarProducto(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`);
    const producto = await response.json();

    document.getElementById("edit-producto-id").value = producto._id;
    document.getElementById("edit-nombre").value = producto.Nombre;
    document.getElementById("edit-marca").value = producto.Marca;
    document.getElementById("edit-peso").value = producto.Peso;
    document.getElementById("edit-unidadPeso").value = producto.UnidadPeso;
    document.getElementById("edit-supermercado").value = producto.Supermercado_id;

    document.getElementById("modal-editar").style.display = "flex";
  } catch (err) {
    console.error("Error al cargar el producto para edición:", err);
  }
}

async function guardarCambiosDesdeFormulario() {
  try {
    const id = document.getElementById("edit-producto-id").value;
    const productoActualizado = {
      Nombre: document.getElementById("edit-nombre").value,
      Marca: document.getElementById("edit-marca").value,
      Peso: parseFloat(document.getElementById("edit-peso").value),
      UnidadPeso: document.getElementById("edit-unidadPeso").value,
      Supermercado_id: document.getElementById("edit-supermercado").value
    };

    await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productoActualizado)
    });

    cerrarFormulario();
    cargarProductos();
  } catch (err) {
    console.error("Error al guardar cambios:", err);
  }
}

function cerrarFormulario() {
  document.getElementById("modal-editar").style.display = "none";
}

async function eliminarProducto(id) {
  try {
    const confirmacion = confirm("¿Seguro que deseas eliminar este producto?");
    if (!confirmacion) return;

    await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    cargarProductos();
  } catch (err) {
    console.error("Error al eliminar el producto:", err);
  }
}

window.guardarCambiosDesdeFormulario = guardarCambiosDesdeFormulario;
window.cerrarFormulario = cerrarFormulario;
window.editarProducto = editarProducto;
window.eliminarProducto = eliminarProducto;
