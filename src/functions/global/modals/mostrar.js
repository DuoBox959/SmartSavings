import { agregarUbicacionAdd } from "../helpers/helpers.js"; 

// ==============================
// ➕ ABRIR FORMULARIO DE AGREGAR PRODUCTO
// ==============================
export function mostrarFormularioAgregar() {
  // 👉 Mostrar el modal
  document.getElementById("modal-agregar").style.display = "flex";

  // 🧹 Reiniciar dinámicos (ubicaciones de supermercado)
  document.getElementById("selector-ubicacion-dinamico").style.display = "none";
  document.getElementById("add-pais-existente").innerHTML = "";
  document.getElementById("add-nuevo-pais").style.display = "none";
  document.getElementById("add-ciudad-existente").style.display = "none";
  document.getElementById("add-nueva-ciudad").style.display = "none";
  document.getElementById("add-nueva-ubicacion").style.display = "none";

  // ➕ Agregar el primer grupo de inputs de ubicación para que el usuario pueda empezar
  agregarUbicacionAdd();
}

// =======================================
// 🧱 FUNCIÓN PARA MOSTRAR PRODUCTOS EN PANTALLA
// =======================================
export function renderizarProductos(productos, precios = []) {
  const productosContainer = document.getElementById("productos-container");
  productosContainer.innerHTML = ""; // 🧹 Limpia productos existentes

  productos.forEach((producto) => {
    // 🏷️ Buscar precio actual
    const precio = precios.find((p) => p.producto_id === producto._id);
    const precioActual = precio?.precioActual || "N/D";

    // 🧩 Construir tarjeta HTML
    const productoHTML = `
      <div class="product-card">
        <a href="detalle-producto.html?id=${producto._id}">
          <img src="${
            producto.Imagen
              ? `http://localhost:3000${producto.Imagen}`
              : "../assets/img/default.webp"
          }" alt="${producto.Nombre}">
          <h3>${producto.Nombre}</h3>
        </a>
        <div class="info-producto">
          <p class="supermercado">Supermercado: ${producto.Supermercado_id || "Desconocido"}</p>
          <p class="precio">Precio: ${precioActual} €</p>
          <p class="peso">Peso: ${producto.Peso || "?"} ${producto.UnidadPeso || ""}</p>
          <p class="marca">Marca: ${producto.Marca?.trim() || "Marca desconocida"}</p>
          <p class="estado">Estado: ${producto.Estado?.trim() || "No especificado"}</p>
        </div>
        <div class="acciones">
          <button class="btn-editar"  data-product-id="${producto._id}">✏️ Editar</button>
          <button class="btn-eliminar"data-product-id="${producto._id}">🗑️ Eliminar</button>
        </div>
      </div>
    `;

    productosContainer.innerHTML += productoHTML;
  });
}
