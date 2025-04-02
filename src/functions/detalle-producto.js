const API_URL = "http://localhost:3000/api/productos";

// Función para cargar y mostrar el producto
async function cargarProducto() {
  // Obtener el parámetro 'id' de la URL
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  if (!productId) {
    Swal.fire("Error", "No se especificó un producto", "error");
    return;
  }

  try {
    // Realizar la petición para obtener el producto
    const response = await fetch(`${API_URL}/${productId}`);
    if (!response.ok) throw new Error("No se encontró el producto");
    const producto = await response.json();

    // Actualizar la vista con los datos del producto
    document.getElementById("producto-imagen").src = producto.Imagen || "../assets/img/default.webp";
    document.getElementById("producto-nombre").textContent = producto.Nombre || "Producto sin nombre";
    document.getElementById("producto-marca").textContent = "Marca: " + (producto.Marca || "Desconocida");
    // Suponiendo que el precio se encuentra en la propiedad "precioActual"
    document.getElementById("producto-precio").textContent = "Precio: " + (producto.precioActual || "N/A") + "€";
    document.getElementById("producto-descripcion").textContent = "Descripción: " + (producto.Descripcion || "Sin descripción");
    document.getElementById("producto-peso").textContent = "Peso: " + producto.Peso + " " + (producto.UnidadPeso || "");
    document.getElementById("producto-estado").textContent = "Estado: " + (producto.Estado || "Sin stock");
  } catch (error) {
    console.error("Error al cargar el producto:", error);
    Swal.fire("Error", "No se pudo cargar el producto", "error");
  }
}

// Función para volver a la página anterior
function volver() {
  window.history.back();
}

// Inicializar la carga cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  // Si tienes funciones para cargar header/footer, puedes llamarlas aquí
  cargarProducto();
});
