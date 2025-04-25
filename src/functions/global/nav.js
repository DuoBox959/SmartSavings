// =======================================
// 🧭 MAPEO DE CATEGORÍAS A TIPOS
// =======================================
// Este objeto relaciona las categorías visibles del menú con los tipos de productos en la base de datos.
// Es utilizado por el sistema de navegación para filtrar los productos por tipo.
const mapaCategorias = {
  alimentacion: ["comida", "bebida", "lácteos", "panadería", "snacks"],
  drogueria: ["higiene", "limpieza", "salud", "cuidado personal"],
  mascotas: ["mascota", "comida para mascotas", "juguetes mascotas"]
};

// =======================================
// 🚀 FUNCIÓN PRINCIPAL PARA CARGAR EL NAV
// =======================================
export async function cargarNav(productos, precios) {
  try {
    // ✅ Carga el HTML del nav de forma asíncrona
    const res = await fetch("/src/pages/global/nav.html");
    const html = await res.text();

    // 📍 Inserta el nav justo después del header
    const header = document.getElementById("header");
    const navWrapper = document.createElement("div");
    navWrapper.innerHTML = html;
    header.insertAdjacentElement("afterend", navWrapper.firstElementChild);

    // 🕒 Asegura que el DOM haya actualizado antes de buscar elementos
    await new Promise(requestAnimationFrame);

    // 🔗 Inicializa enlaces y buscador
    inicializarNavegacion(productos, precios);
    aplicarFiltroBusqueda(productos);
  } catch (error) {
    console.error("❌ Error al cargar el nav dinámico:", error);
  }
}

// =======================================
// 📂 FUNCIÓN PARA ENLACES DE NAVEGACIÓN
// =======================================
// Asocia los enlaces del menú con su categoría y filtra los productos al hacer clic
export function inicializarNavegacion(productos, precios) {
  const enlaces = document.querySelectorAll(".nav-categorias a[data-categoria]");

  if (!enlaces.length) {
    console.warn("⚠️ No se encontraron enlaces de navegación");
    return;
  }

  // 🎯 Al hacer clic en un enlace de categoría, se filtran los productos correspondientes
  enlaces.forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();

      const categoria = link.getAttribute("data-categoria");
      const tiposPermitidos = mapaCategorias[categoria];
      if (!tiposPermitidos) return;

      const filtrados = productos.filter(p =>
        tiposPermitidos.includes(p.Tipo?.toLowerCase())
      );

      renderizarProductos(filtrados, precios);
    });
  });
}

// =======================================
// 🔍 FUNCIÓN DE BÚSQUEDA EN TIEMPO REAL
// =======================================
// Permite buscar productos por nombre, marca, ingredientes, peso, etc.
export function aplicarFiltroBusqueda(productosOriginales) {
  const input = document.getElementById("busqueda-input");

  if (!input) {
    console.warn("⚠️ Campo de búsqueda no encontrado (busqueda-input)");
    return;
  }

  input.addEventListener("input", () => {
    const valor = input.value.toLowerCase();

    const productosFiltrados = productosOriginales.filter(producto => {
      const ingredientes = producto.Ingredientes?.join(", ") || "";
      return (
        producto.Nombre?.toLowerCase().includes(valor) ||
        producto.Marca?.toLowerCase().includes(valor) ||
        producto.Precio?.toString().includes(valor) ||
        producto.Peso?.toString().includes(valor) ||
        producto.Estado?.toLowerCase().includes(valor) ||
        producto.Supermercado_id?.toLowerCase().includes(valor) ||
        producto.Ciudad?.toLowerCase().includes(valor) ||
        ingredientes.toLowerCase().includes(valor)
      );
    });

    renderizarProductos(productosFiltrados);
  });
}

// =======================================
// 🧱 FUNCIÓN PARA MOSTRAR PRODUCTOS EN PANTALLA
// =======================================
// Crea el HTML necesario para mostrar cada producto en la interfaz
export function renderizarProductos(productos, precios = []) {
  const productosContainer = document.getElementById("productos-container");
  productosContainer.innerHTML = ""; // 🧹 Limpia contenido anterior

  productos.forEach(producto => {
    const precio = precios.find(p => p.producto_id === producto._id);
    const precioActual = precio?.precioActual || "N/D";

    const productoHTML = `
      <div class="product-card">
        <a href="detalle-producto.html?id=${producto._id}">
          <img src="${producto.Imagen ? `http://localhost:3000${producto.Imagen}` : '../assets/img/default.webp'}" alt="${producto.Nombre}">
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
          <button class="btn-editar" onclick="editarProducto('${producto._id}')">✏️ Editar</button>
          <button class="btn-eliminar" onclick="eliminarProducto('${producto._id}')">🗑️ Eliminar</button>
        </div>
      </div>
    `;

    productosContainer.innerHTML += productoHTML;
  });
}
