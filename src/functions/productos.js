import { db } from "../libs/db.js";

let productosCache = [];

$(document).ready(() => {
  cargarProductos();
  actualizarCampoPeso(); // Asegura que todos los productos tengan el campo "peso"
});

async function cargarProductos() {
  try {
    const productosContainer = document.getElementById("productos-container"); 
    productosContainer.innerHTML = ""; // Limpiar el contenedor antes de actualizar

    const result = await db.allDocs({ include_docs: true });
    productosCache = result.rows.map((row) => row.doc);

    productosCache.forEach((producto) => {
      const productoHTML = `
        <div class="product-card">
            <span class="favorite-icon" onclick="toggleFavorito(this)">❤️</span>
            <img src="${producto.imagen || 'default.jpg'}" alt="${producto.nombre}">
            <h3>${producto.nombre || "Producto sin nombre"}</h3>
            <p class="marca">${producto.marca || "Marca desconocida"}</p>
            <p class="precio">desde ${producto.precioUnidad ? `${producto.precioUnidad} €` : "0 €"}</p>
            <div class="acciones">
                <button onclick="editarProducto('${producto._id}')">✏️ Editar</button>
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
    console.log('Campo "peso" actualizado en todos los productos.');
    cargarProductos();
  } catch (err) {
    console.error('Error actualizando campo "peso":', err);
  }
}

// Función para alternar favorito
function toggleFavorito(element) {
  element.classList.toggle("favorito");
}

// Exponer funciones al ámbito global
window.editarProducto = editarProducto;
window.eliminarProducto = eliminarProducto;
window.mostrarFormularioAgregar = mostrarFormularioAgregar;
window.guardarCambiosDesdeFormulario = guardarCambiosDesdeFormulario;
window.cerrarFormulario = cerrarFormulario;
window.volverAtras = volverAtras;
window.toggleFavorito = toggleFavorito;
