import { db } from "../libs/db.js";
import { cargarHeaderFooter } from "../functions/global/funciones.js";
import { gestionarUsuarioAutenticado } from "../functions/global/header.js";
import { volverAtras } from "../functions/global/funciones.js";

let productosCache = [];
window.volverAtras = volverAtras;

$(document).ready(() => {
  cargarProductos();
  actualizarCampoPeso(); // Asegura que todos los productos tengan el campo "peso"
});

// Evento que se ejecuta cuando el DOM se ha cargado completamente
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Cargar el header y el footer dinámicamente
    await cargarHeaderFooter();

    // Llamar a la función para gestionar el usuario autenticado
    gestionarUsuarioAutenticado();

    // Elementos de la barra de navegación
    const registerLink = document.getElementById("registerLink");
    const loginLink = document.getElementById("loginLink");
    const userName = document.getElementById("userName");
    const logout = document.getElementById("logout");
    const userDropdown = document.getElementById("userDropdown");
    const userMenu = document.getElementById("userMenu");

    // Obtener datos del usuario desde sessionStorage o localStorage
    let user =
      JSON.parse(sessionStorage.getItem("user")) ||
      JSON.parse(localStorage.getItem("user")); // Primero intenta en sessionStorage

    if (user) {
      // Usuario logueado: ocultar los enlaces de "Registrarse" e "Iniciar Sesión"
      registerLink.style.display = "none";
      loginLink.style.display = "none";

      // Mostrar nombre del usuario y el botón de logout
      userName.textContent = `Bienvenido, ${user.name}`;

      // Mostrar el menú desplegable
      userDropdown.style.display = "inline-block";

      // Alternar el menú desplegable al hacer clic en el nombre de usuario
      userName.addEventListener("click", (event) => {
        event.stopPropagation(); // Evita que el evento se propague y cierre el menú inmediatamente
        userMenu.classList.toggle("show"); // Activa o desactiva el dropdown
      });

      // Cerrar sesión cuando se haga clic en "Cerrar Sesión"
      logout.addEventListener("click", () => {
        sessionStorage.removeItem("user"); // Elimina de sessionStorage
        localStorage.removeItem("user"); // Elimina de localStorage por si acaso
        window.location.href = "index.html"; // Redirige a la página de inicio
      });

      // Cerrar el menú si se hace clic fuera del dropdown
      document.addEventListener("click", (event) => {
        if (!userDropdown.contains(event.target)) {
          userMenu.classList.remove("show"); // Cierra el dropdown si haces clic fuera
        }
      });
    } else {
      // Si no hay usuario logueado, mostrar los enlaces de "Registrarse" y "Iniciar Sesión"
      registerLink.style.display = "inline";
      loginLink.style.display = "inline";

      // Ocultar el nombre del usuario y el botón de logout
      userName.style.display = "none";
      logout.style.display = "none";

      // Ocultar el dropdown
      userDropdown.style.display = "none";
    }
  } catch (error) {
    console.error("Hubo un error durante la inicialización:", error);
  }
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
            <img src="${producto.img || "default.jpg"}" alt="${producto.nombre || "Producto sin nombre"}">
            <h3>${producto.nombre || "Producto sin nombre"}</h3>
            <p class="marca">${producto.marca || "Marca desconocida"}</p>
            <p class="precio">Desde ${producto.precioUnidad ? `${producto.precioUnidad} €` : "0 €"}</p>
            <p class="precio-lote">Lote: ${producto.precioLote ? `${producto.precioLote} €` : "0 €"}</p>
            <p class="peso">Peso: ${producto.peso ? `${producto.peso} ${producto.unidadPeso || "kg"}` : "0 kg"}</p>
            <p class="supermercado">Supermercado: ${producto.supermercado || "No especificado"}</p>
            <p class="ubicacion">Ubicación: ${producto.ubicacion || "No disponible"}</p>
            <p class="biografia">${producto.biografia || "Sin biografía"}</p>
            <p class="descripcion">${producto.descripcion || "Sin descripción"}</p>
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

async function editarProducto(id) {
  try {
      // Obtener el producto de la base de datos
      const producto = await db.get(id);

      // Verificar que el producto tiene datos válidos antes de asignarlos
      document.getElementById("edit-producto-id").value = producto._id;
      document.getElementById("edit-nombre").value = producto.nombre || "";
      document.getElementById("edit-marca").value = producto.marca || "";
      document.getElementById("edit-precioUnidad").value = producto.precioUnidad !== undefined ? producto.precioUnidad : "";
      document.getElementById("edit-precioLote").value = producto.precioLote !== undefined ? producto.precioLote : "";
      document.getElementById("edit-peso").value = producto.peso !== undefined ? producto.peso : "";
      document.getElementById("edit-unidadPeso").value = producto.unidadPeso || "kg";
      document.getElementById("edit-supermercado").value = producto.supermercado || "";
      document.getElementById("edit-ubicacion").value = producto.ubicacion || "";
      document.getElementById("edit-biografia").value = producto.biografia || "";
      document.getElementById("edit-descripcion").value = producto.descripcion || "";

      // 🔹 Mostrar el modal con `flex` en lugar de `block` (para evitar problemas de visualización)
      const modal = document.getElementById("modal-editar");
      modal.style.display = "flex";

      console.log("Modal abierto y datos cargados:", producto);
  } catch (err) {
      console.error("Error al cargar el producto para edición:", err);
  }
}

async function guardarCambiosDesdeFormulario() {
  try {
      const id = document.getElementById("edit-producto-id").value;

      // Obtener los datos actualizados
      const productoActualizado = {
          _id: id,
          _rev: (await db.get(id))._rev, // Necesario para actualizar en PouchDB
          nombre: document.getElementById("edit-nombre").value,
          marca: document.getElementById("edit-marca").value,
          precioUnidad: parseFloat(document.getElementById("edit-precioUnidad").value) || 0,
          precioLote: parseFloat(document.getElementById("edit-precioLote").value) || 0,
          peso: parseFloat(document.getElementById("edit-peso").value) || 0,
          unidadPeso: document.getElementById("edit-unidadPeso").value || "kg",
          supermercado: document.getElementById("edit-supermercado").value,
          ubicacion: document.getElementById("edit-ubicacion").value,
          biografia: document.getElementById("edit-biografia").value,
          descripcion: document.getElementById("edit-descripcion").value,
      };

      await db.put(productoActualizado); // Guardar cambios en la base de datos
      console.log("Producto actualizado correctamente");

      cerrarFormulario(); // Cerrar modal
      cargarProductos(); // Refrescar la lista de productos
  } catch (err) {
      console.error("Error al guardar cambios:", err);
  }
}

window.guardarCambiosDesdeFormulario = guardarCambiosDesdeFormulario;


function cerrarFormulario() {
  document.getElementById("modal-editar").style.display = "none";
}

window.cerrarFormulario = cerrarFormulario;

async function eliminarProducto(id) {
  try {
    const producto = await db.get(id);

    const confirmacion = confirm(`¿Estás seguro de que deseas eliminar "${producto.nombre}"?`);
    if (!confirmacion) return;

    await db.remove(producto);
    console.log(`Producto "${producto.nombre}" eliminado correctamente.`);
    
    cargarProductos(); // Actualizar la lista después de eliminar
  } catch (err) {
    console.error("Error al eliminar el producto:", err);
  }
}

window.eliminarProducto = eliminarProducto;

// Exponer funciones al ámbito global
window.editarProducto = editarProducto;
window.eliminarProducto = eliminarProducto;
window.mostrarFormularioAgregar = mostrarFormularioAgregar;
window.guardarCambiosDesdeFormulario = guardarCambiosDesdeFormulario;
window.cerrarFormulario = cerrarFormulario;
window.toggleFavorito = toggleFavorito;
