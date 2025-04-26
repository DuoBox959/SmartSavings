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

// =======================================
// 🔍 FUNCIÓN DE BÚSQUEDA EN TIEMPO REAL
// =======================================
// Permite buscar productos por nombre, marca, ingredientes, peso, etc.
export function aplicarFiltroBusqueda() {  // 👈 SIN parámetros aquí
  const input = document.getElementById("busqueda-input");

  if (!input) {
    console.warn("⚠️ Campo de búsqueda no encontrado (busqueda-input)");
    return;
  }

  console.log("🧠 aplicarFiltroBusqueda inicializado correctamente ✅");

  input.addEventListener("input", () => {
    const valor = input.value.toLowerCase();
    console.log("⌨️ Usuario escribió en búsqueda:", valor);

    const productosFiltrados = productosGlobal.filter(producto => { // 👈 USAR productosGlobal AQUÍ
      const ingredientes = producto.Ingredientes?.join(", ") || "";
      const cumpleFiltro = 
        producto.Nombre?.toLowerCase().includes(valor) ||
        producto.Marca?.toLowerCase().includes(valor) ||
        producto.Precio?.toString().includes(valor) ||
        producto.Peso?.toString().includes(valor) ||
        producto.Estado?.toLowerCase().includes(valor) ||
        producto.Supermercado_id?.toLowerCase().includes(valor) ||
        producto.Ciudad?.toLowerCase().includes(valor) ||
        ingredientes.toLowerCase().includes(valor);

      console.log(`🔎 ¿Producto '${producto.Nombre}' coincide con '${valor}'?`, cumpleFiltro);
      return cumpleFiltro;
    });

    console.log(`🧹 Productos filtrados (${productosFiltrados.length} encontrados):`, productosFiltrados);

    renderizarProductos(productosFiltrados, preciosGlobal); // 👈 Y usar preciosGlobal
  });
}



// 🌍 Exponemos funciones al window
window.inicializarNavegacion = inicializarNavegacion;
window.aplicarFiltroBusqueda = aplicarFiltroBusqueda;
