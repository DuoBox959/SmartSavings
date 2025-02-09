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

// Exponer funciones al ámbito global
window.editarProducto = editarProducto;
window.eliminarProducto = eliminarProducto;
window.mostrarFormularioAgregar = mostrarFormularioAgregar;
window.guardarCambiosDesdeFormulario = guardarCambiosDesdeFormulario;
window.cerrarFormulario = cerrarFormulario;
window.toggleFavorito = toggleFavorito;
