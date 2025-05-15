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
// 🚀 FUNCION PARA BOTON VOLVER ATRAS
// =======================================

export function volverAtras() {
  if (document.referrer) {
    window.history.back();
  } else {
    window.location.href = "productos.html";
  }
}
