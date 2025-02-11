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
          if (!document.querySelector("script[src='../functions/global/chatbot.js']")) {
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

// 🔙 Regresar a la página anterior
export function volverAtras() {
  window.location.href = "index.html";
}
