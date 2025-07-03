// ==============================
// 📦 IMPORTACIONES DE FUNCIONES EXTERNAS
// ==============================
import { cargarHeaderFooter, cargarNav } from "../functions/global/funciones.js";
import { gestionarUsuarioAutenticado } from "../functions/global/header.js";
import { aplicarFiltroBusqueda } from "../functions/global/nav.js";
import { API_BASE } from "../functions/global/UTILS/utils.js";
import { eliminarProducto } from "../functions/global/botones/botons_eliminar.js";
import { guardarCambiosDesdeFormulario } from "../functions/global/botones/botons_actualizar.js";
import { guardarProductoNuevo } from "../functions/global/botones/botons_agregar.js";
import { mostrarFormularioAgregar } from "../functions/global/modals/mostrar.js";
import { editarProducto } from "../functions/global/actions/editar.js";
import { renderizarProductos } from "../functions/global/modals/mostrar.js";
import { inicializarBotonesGlobales, inicializarSelectsDinamicos } from "../functions/global/eventos/events.js";
import { agregarUbicacionAdd, toggleNuevoCampo } from "../functions/global/helpers/helpers.js";
import { cargarOpcionesEnSelects } from "../functions/global/selects/carga.js";

// ==============================
// 🚀 INICIALIZACIÓN AL CARGAR DOCUMENTO
// ==============================
document.addEventListener("DOMContentLoaded", async () => {
  // 🔒 Verificar si el usuario está autenticado
  const usuario = sessionStorage.getItem("user");
  if (!usuario) {
    Swal.fire({
      icon: "warning",
      title: "No has iniciado sesión",
      text: "Por favor, inicia sesión para continuar.",
      confirmButtonText: "Ir al inicio",
      allowOutsideClick: false,
    }).then(() => {
      window.location.href = "index.html";
    });
    return;
  }

  try {
    await cargarHeaderFooter();

    // 📦 Obtener productos y precios en paralelo
    const [productosRes, preciosRes] = await Promise.all([
      fetch(`${API_BASE}/api/productos`),
      fetch(`${API_BASE}/api/precios`),
    ]);

    const productos = await productosRes.json();
    const precios = await preciosRes.json();

    await cargarNav(productos, precios);
    renderizarProductos(productos, precios); // Esta función debería también adjuntar escuchadores de edición/eliminación a las tarjetas de productos creadas dinámicamente
    aplicarFiltroBusqueda();
    gestionarUsuarioAutenticado();

    inicializarBotonesGlobales(); // Esta función debería manejar los botones globales iniciales

    // 📥 Cargar opciones dinámicas en los selects
    await cargarOpcionesEnSelects([
      { campo: "supermercado", endpoint: "supermercados", usarId: true },
      { campo: "tipo", endpoint: "tipos", usarId: false },
      { campo: "subtipo", endpoint: "subtipos", usarId: false },
      { campo: "marca", endpoint: "marcas", usarId: false },
      { campo: "proveedor", endpoint: "proveedor", usarId: true },
    ]);

    // 🔁 Añadir eventos a los selects que pueden tener valor "nuevo"
    inicializarSelectsDinamicos();

    // Escuchador de eventos para el botón "Agregar Producto" (abre el modal de agregar)
    document.getElementById("btn-agregar-producto")?.addEventListener("click", mostrarFormularioAgregar);

    // Escuchador de eventos para el botón "Guardar Producto" (dentro del modal de agregar)
    const botonGuardarProducto = document.getElementById("btn-guardar-producto");
    if (botonGuardarProducto) {
      console.log("🟢 Escuchando click en 'Agregar Producto' dentro del modal...");
      botonGuardarProducto.addEventListener("click", guardarProductoNuevo);
    } else {
      console.warn("❌ No se encontró el botón 'btn-guardar-producto'");
    }

    // Escuchador de eventos para el botón "Guardar Cambios" (dentro del modal de edición)
    const botonGuardarCambios = document.getElementById("btn-guardar-cambios");
    if (botonGuardarCambios) {
      botonGuardarCambios.addEventListener("click", guardarCambiosDesdeFormulario);
    }

    // Escuchador de eventos para el botón "Volver Atrás"
    document.getElementById("btn-volver-atras")?.addEventListener("click", () => {
      window.history.back(); // Vuelve a la página anterior en el historial
    });

    // Escuchadores de eventos para cerrar modales (Agregar y Editar)
    document.getElementById("btn-cerrar-agregar")?.addEventListener("click", () => {
      document.getElementById("modal-agregar").style.display = "none";
    });
    document.getElementById("btn-cancelar-agregar")?.addEventListener("click", () => {
      document.getElementById("modal-agregar").style.display = "none";
    });

    document.getElementById("btn-cerrar-editar")?.addEventListener("click", () => {
      document.getElementById("modal-editar").style.display = "none";
    });
    document.getElementById("btn-cancelar-editar")?.addEventListener("click", () => {
      document.getElementById("modal-editar").style.display = "none";
    });

    // Escuchador de eventos para el botón "Añadir ubicación" dentro del modal de añadir producto
    document.getElementById("btn-agregar-ubicacion")?.addEventListener("click", agregarUbicacionAdd);

    // Ejemplo de delegación de eventos para los botones de edición y eliminación en las tarjetas de producto:
    document.getElementById("productos-container")?.addEventListener("click", (event) => {
      // Manejar clics en el botón de edición
      if (event.target.classList.contains("btn-editar")) {
        const productId = event.target.dataset.productId;
        if (productId) {
          editarProducto(productId);
        }
      }

      // Manejar clics en el botón de eliminar
      if (event.target.classList.contains("btn-eliminar")) {
        const productId = event.target.dataset.productId;
        if (productId) {
          eliminarProducto(productId);
        }
      }
    });

    // Escuchadores de eventos para alternar los campos de entrada 'nuevo' cuando se selecciona 'Otro (escribir nuevo)'
    // Idealmente, esto debería formar parte de `inicializarSelectsDinamicos` o una función de ayuda similar
    // ya que ya has importado `toggleNuevoCampo`.
    document.getElementById("add-tipo-select")?.addEventListener("change", (event) => toggleNuevoCampo(event.target.id, "add-tipo-nuevo"));
  document.getElementById("add-supermercado-select")?.addEventListener("change", () => toggleNuevoCampo("add", "supermercado", "selector-ubicacion-dinamico"));
    document.getElementById("add-marca-select")?.addEventListener("change", (event) => toggleNuevoCampo(event.target.id, "add-marca-nuevo"));
    document.getElementById("add-proveedor-select")?.addEventListener("change", (event) => toggleNuevoCampo(event.target.id, "add-proveedor-nuevo"));
    document.getElementById("add-subtipo-select")?.addEventListener("change", (event) => toggleNuevoCampo(event.target.id, "add-subtipo-nuevo"));

    document.getElementById("edit-tipo-select")?.addEventListener("change", (event) => toggleNuevoCampo(event.target.id, "edit-tipo-nuevo"));
    document.getElementById("edit-supermercado-select")?.addEventListener("change", (event) => toggleNuevoCampo(event.target.id, "edit-supermercado-nuevo"));
    document.getElementById("edit-proveedor-select")?.addEventListener("change", (event) => toggleNuevoCampo(event.target.id, "edit-proveedor-nuevo"));
    document.getElementById("edit-subtipo-select")?.addEventListener("change", (event) => toggleNuevoCampo(event.target.id, "edit-subtipo-nuevo"));


  } catch (error) {
    console.error("Error en la inicialización:", error);
  }
});