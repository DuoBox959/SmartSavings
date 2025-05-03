import { volverAtras } from "../functions/global/funciones.js";

// Hacer el botón de volver atrás funcional
window.volverAtras = volverAtras;

document.addEventListener("DOMContentLoaded", () => {
  // 👇 Inicializar con clave publica
  emailjs.init(EMAILJS_PUBLIC_KEY);

  const form = document.querySelector("form");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    emailjs
      .sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, form)
      .then(() => {
        Swal.fire({
          icon: "success",
          title: "Mensaje enviado",
          text: "Gracias por escribirnos. Te responderemos pronto.",
        });
        form.reset();
      })
      .catch((error) => {
        console.error("Error al enviar el mensaje:", error);
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "No se pudo enviar el mensaje. Intenta nuevamente más tarde.",
        });
      });
  });
});
