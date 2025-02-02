export async function cargarHeaderFooter() {
  try {
    const headerResponse = await fetch("../pages/global/header.html");
    if (!headerResponse.ok) {
      throw new Error("Error al cargar el header");
    }
    const headerData = await headerResponse.text();
    document.getElementById("header").innerHTML = headerData;

    const footerResponse = await fetch("../pages/global/footer.html");
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

// 🔙 Regresar a la página anterior
export function volverAtras() {
  window.location.href = "index.html";
}
