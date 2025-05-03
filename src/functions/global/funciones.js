// =======================================
// 🚀 FUNCIONES DE CARGAS
// =======================================

// 🚀 FUNCIÓN PARA CARGAR EL HEADER Y EL FOOTER
export async function cargarHeaderFooter() {
  try {
    const headerResponse = await fetch("/src/pages/global/header.html");
    if (!headerResponse.ok) {
      throw new Error("Error al cargar el header");
    }
    const headerData = await headerResponse.text();
    document.getElementById("header").innerHTML = headerData;

    const footerResponse = await fetch("/src/pages/global/footer.html");
    if (!footerResponse.ok) {
      throw new Error("Error al cargar el footer");
    }
    const footerData = await footerResponse.text();
    document.getElementById("footer").innerHTML = footerData;
  } catch (error) {
    console.error("Hubo un error al cargar el header o footer:", error);
  }
}

// cerrar sesion
export function cerrarSesion() {
  sessionStorage.removeItem("user");
  localStorage.removeItem("user");
  window.location.href = "index.html";
}
export async function cargarChatbot() {
  try {
    const chatBotContainer = document.getElementById("chatBot");
    if (!chatBotContainer) {
      console.warn("⏳ Contenedor del chatbot no encontrado. Reintentando...");
      setTimeout(cargarChatbot, 500);
      return;
    }

    const response = await fetch("../pages/global/chatbot.html");
    const chatbotHTML = await response.text();
    chatBotContainer.innerHTML = chatbotHTML;
    console.log("✅ Chatbot cargado correctamente.");

    // Esperar a que el chatbot esté en el DOM antes de cargar el script
    setTimeout(() => {
      if (
        !document.querySelector("script[src='../functions/global/chatbot.js']")
      ) {
        const script = document.createElement("script");
        script.src = "../functions/global/chatbot.js";
        script.defer = true;
        document.body.appendChild(script);
        console.log("✅ Script del chatbot cargado.");
      }
    }, 500);
  } catch (error) {
    console.error("❌ Error al cargar el chatbot:", error);
  }
}

// 🚀 FUNCIÓN PARA CARGAR EL NAV

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
  } catch (error) {
    console.error("❌ Error al cargar el nav dinámico:", error);
  }
}

// =======================================
// 🚀 FUNCIONES PARA BOTONES
// =======================================

// 🚀 FUNCIONES PARA VOLVER ATRAS
export function volverAtras() {
  if (document.referrer) {
    window.history.back();
  } else {
    window.location.href = "productos.html";
  }
}

// =======================================
// 🧱 FUNCIÓN PARA MOSTRAR PRODUCTOS EN PANTALLA
// =======================================
// Crea el HTML necesario para mostrar cada producto en la interfaz
export function renderizarProductos(productos, precios = []) {
  const productosContainer = document.getElementById("productos-container");
  productosContainer.innerHTML = ""; // 🧹 Limpia contenido anterior

  productos.forEach((producto) => {
    const precio = precios.find((p) => p.producto_id === producto._id);
    const precioActual = precio?.precioActual || "N/D";

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
          <p class="supermercado">Supermercado: ${
            producto.Supermercado_id || "Desconocido"
          }</p>
          <p class="precio">Precio: ${precioActual} €</p>
          <p class="peso">Peso: ${producto.Peso || "?"} ${
      producto.UnidadPeso || ""
    }</p>
          <p class="marca">Marca: ${
            producto.Marca?.trim() || "Marca desconocida"
          }</p>
          <p class="estado">Estado: ${
            producto.Estado?.trim() || "No especificado"
          }</p>
        </div>
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
}

window.renderizarProductos = renderizarProductos;
