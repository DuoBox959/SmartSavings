import { cargarHeaderFooter } from "../functions/global/funciones.js";
import { gestionarUsuarioAutenticado } from "../functions/global/header.js";  // Importar la función

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Espera a que los elementos header y footer se hayan cargado
    await cargarHeaderFooter();

    const header = document.getElementById('header');
    const footer = document.getElementById('footer');

    if (header && footer) {
      // Manipula el estilo solo si los elementos existen
      header.style.display = 'block';
      footer.style.display = 'block';

      // Asegúrate de que el contenido del header esté completamente cargado
      header.addEventListener('load', () => {
        // Llamada a la función gestionarUsuarioAutenticado después de que el header esté completamente cargado
        gestionarUsuarioAutenticado();  
      });
      
    } else {
      console.error('Los elementos #header o #footer no están disponibles');
    }
  } catch (error) {
    console.error('Hubo un error al cargar el header o footer:', error);
  }
});
