// ==============================
// 📦 IMPORTACIONES DE FUNCIONES EXTERNAS
// ==============================
import { cargarHeaderFooter, cargarNav } from "../functions/global/funciones.js";
import { gestionarUsuarioAutenticado } from "../functions/global/header.js";
import { aplicarFiltroBusqueda } from "../functions/global/nav.js";

import { eliminarProducto } from "../functions/global/botones/botons_eliminar.js";
import { guardarCambiosDesdeFormulario } from "../functions/global/botones/botons_actualizar.js";

import { mostrarFormularioAgregar } from "../functions/global/modals/mostrar.js";

import { inicializarBotonesGlobales, inicializarSelectsDinamicos } from "../functions/global/eventos/events.js";

import {  agregarUbicacionAdd, toggleNuevoCampo} from "../functions/global/helpers/helpers.js";

import { cargarOpcionesEnSelects } from "../functions/global/selects/carga.js";

import { editarProducto } from "../functions/global/actions/editar.js";

// 🌎 API base URL
const API_URL = "http://localhost:3000/api/productos";

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
      fetch("http://localhost:3000/api/productos"),
      fetch("http://localhost:3000/api/precios"),
    ]);

    const productos = await productosRes.json();
    const precios = await preciosRes.json();

    await cargarNav(productos, precios);
    renderizarProductos(productos, precios);
    aplicarFiltroBusqueda();
    gestionarUsuarioAutenticado();
   
    inicializarBotonesGlobales();

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
    document.getElementById("btn-agregar-producto")?.addEventListener("click", mostrarFormularioAgregar);
    
    const botonGuardarCambios = document.getElementById("btn-guardar-cambios");
    if (botonGuardarCambios) {
      botonGuardarCambios.addEventListener("click", guardarCambiosDesdeFormulario);
    }


  } catch (error) {
    console.error("Error en la inicialización:", error);
  }
});

// ==============================
// 🌍 FUNCIONES EXPUESTAS A NIVEL GLOBAL PARA HTML
// ==============================
window.cargarOpcionesEnSelects = cargarOpcionesEnSelects;
window.editarProducto = editarProducto;
window.eliminarProducto = eliminarProducto;
window.mostrarFormularioAgregar = mostrarFormularioAgregar;
window.agregarUbicacionAdd = agregarUbicacionAdd;
window.toggleNuevoCampo = toggleNuevoCampo;