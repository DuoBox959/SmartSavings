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


// 🌍 Variables globales solo en este archivo
let productosGlobal = [];
let preciosGlobal = [];

// =======================================
// 📂 FUNCIÓN PARA ENLACES DE NAVEGACIÓN
// =======================================
// Asocia los enlaces del menú con su categoría y filtra los productos al hacer clic
export function inicializarNavegacion(productos, precios) {
  productosGlobal = productos;
  preciosGlobal = precios;

  const enlaces = document.querySelectorAll(".nav-categorias a[data-categoria]");
  if (!enlaces.length) {
    console.warn("⚠️ No se encontraron enlaces de navegación");
    return;
  }

  enlaces.forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const categoria = link.getAttribute("data-categoria");
      const tiposPermitidos = mapaCategorias[categoria];
      if (!tiposPermitidos) return;

      const filtrados = productosGlobal.filter(p =>
        tiposPermitidos.includes(p.Tipo?.toLowerCase())
      );

      renderizarProductos(filtrados, preciosGlobal);
    });
  });

  aplicarFiltroBusqueda(); // ⚡ También inicia el buscador aquí
}

// ===================================================
// 🔍 FUNCIÓN DE BÚSQUEDA EN TIEMPO REAL
// ===================================================
let filtrosInicializados = false;

export function aplicarFiltroBusqueda() {
  if (filtrosInicializados) return;
  filtrosInicializados = true;

  const input = document.getElementById("busqueda-input");
  const filtroToggle = document.getElementById("campo-filtro-toggle");
  const filtroMenu = document.getElementById("campo-filtro-menu");
  const cerrarFiltroBtn = document.getElementById("cerrar-filtro");
  const tagsContainer = document.getElementById("busqueda-tags");

  if (!input || !filtroToggle || !filtroMenu || !tagsContainer) {
    console.warn("⚠️ Elementos no encontrados");
    return;
  }

  filtroToggle.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation(); // 🔥 Aquí está la clave
    filtroMenu.classList.toggle("hidden");
  });
  

  if (cerrarFiltroBtn) {
    cerrarFiltroBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      filtroMenu.classList.add("hidden");
    });
  }

  document.addEventListener('click', (e) => {
    const esClickDentro = filtroMenu.contains(e.target) || filtroToggle.contains(e.target);
    if (!esClickDentro) filtroMenu.classList.add("hidden");
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const texto = input.value.trim();
      if (texto !== "") {
        crearTagBusqueda(texto);
        buscarConTexto(texto);
        input.value = ""; // Limpiar el campo de texto
      }
    }
  });

  function crearTagBusqueda(texto) {
    tagsContainer.innerHTML = ""; // Limpia anteriores tags
    const tag = document.createElement("div");
    tag.className = "busqueda-tag";
    tag.innerHTML = `
      <span>${texto}</span>
      <span class="cerrar-tag">✖️</span>
    `;
    tag.querySelector(".cerrar-tag").addEventListener("click", () => {
      tag.remove();
      input.value = "";
      renderizarProductos(productosGlobal, preciosGlobal); // Mostrar todos
    });

    tagsContainer.appendChild(tag);
  }

  function buscarConTexto(texto) {
    const valor = texto.replace(",", ".").toLowerCase(); // Ahora soporta coma o punto
    const camposSeleccionados = Array.from(filtroMenu.querySelectorAll("input:checked")).map(input => input.value);
  
    const productosFiltrados = productosGlobal.filter(producto => {
      const precioEncontrado = preciosGlobal.find(p => p.producto_id === producto._id);
      const precioActual = precioEncontrado?.precioActual;
  
      if (camposSeleccionados.length === 0) {
        return (
          producto.Nombre?.toLowerCase().includes(valor) ||
          producto.Marca?.toLowerCase().includes(valor) ||
          (precioActual != null && precioActual.toString().includes(valor)) ||
          producto.Peso?.toLowerCase().includes(valor) ||
          producto.Estado?.toLowerCase().includes(valor) ||
          producto.Supermercado_id?.toLowerCase().includes(valor)
        );
      }
  
      return camposSeleccionados.some(campo => {
        if (campo === "Precio") {
          return (precioActual != null && precioActual.toString().includes(valor));
        } else {
          const datoProducto = producto[campo];
          if (datoProducto == null) return false;
          return datoProducto.toString().toLowerCase().includes(valor);
        }
      });
    });
  
    renderizarProductos(productosFiltrados, preciosGlobal);
  }
  

  input.addEventListener("input", buscarYFiltrar);
  filtroMenu.addEventListener("change", buscarYFiltrar);

  function buscarYFiltrar() {
    const valor = input.value.toLowerCase();
    if (!valor) {
      renderizarProductos(productosGlobal, preciosGlobal);
      return;
    }
    buscarConTexto(valor);
  }
}

// 🌍 Exponemos funciones al window
window.inicializarNavegacion = inicializarNavegacion;
window.aplicarFiltroBusqueda = aplicarFiltroBusqueda;
