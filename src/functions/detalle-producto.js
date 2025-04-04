// ==============================
// 📦 IMPORTACIONES
// ==============================
import { cargarHeaderFooter, volverAtras } from "../functions/global/funciones.js";
import { gestionarUsuarioAutenticado } from "../functions/global/header.js";

window.volverAtras = volverAtras;

const API_URL = "http://localhost:3000/api/productos";

// ==============================
// 🚀 INICIALIZACIÓN
// ==============================
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await cargarHeaderFooter(); // ✅ Cargar header/footer
    gestionarUsuarioAutenticado(); // ✅ Si estás autenticando usuarios

    await cargarOpcionesEnSelects([
      { campo: "supermercado", endpoint: "supermercados", usarId: true },
      { campo: "tipo", endpoint: "tipos", usarId: false },
      { campo: "subtipo", endpoint: "subtipos", usarId: false },
      { campo: "marca", endpoint: "marcas", usarId: false },
      { campo: "proveedor", endpoint: "proveedores", usarId: true },
    ]);

    await cargarProducto();
  } catch (err) {
    console.error("❌ Error al iniciar la página:", err);
  }
});

// ==============================
// 📥 CARGAR Y MOSTRAR PRODUCTO
// ==============================
async function cargarProducto() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id");

  if (!productId) {
    return Swal.fire("Error", "No se especificó un producto", "error");
  }

  try {
    const [productoRes, preciosRes, supermercadosRes, proveedoresRes, descRes] = await Promise.all([
      fetch(`${API_URL}/${productId}`),
      fetch("http://localhost:3000/api/precios"),
      fetch("http://localhost:3000/api/supermercados"),
      fetch("http://localhost:3000/api/proveedor"),
      fetch("http://localhost:3000/api/descripcion")
    ]);

    if (!productoRes.ok) throw new Error("Producto no encontrado");

    const producto = await productoRes.json();
    const precios = await preciosRes.json();
    const supermercados = await supermercadosRes.json();
    const proveedores = await proveedoresRes.json();
    const descripciones = await descRes.json();

    const productoIdStr = producto._id?.toString();

    const precioData = precios.find(p => p.producto_id?.toString() === productoIdStr);
    const supermercado = supermercados.find(s => s._id?.toString() === producto.Supermercado_id?.toString());
    const proveedor = proveedores.find(p => p._id?.toString() === producto.Proveedor_id?.toString());
    const descripcion = descripciones.find(d => d.Producto_id === producto.Nombre);

    // Mostrar datos
    document.getElementById("producto-imagen").src = producto.Imagen || "../assets/img/default.webp";
    document.getElementById("producto-nombre").textContent = producto.Nombre || "Producto sin nombre";
    document.getElementById("producto-marca").textContent = "Marca: " + (producto.Marca || "Desconocida");
    document.getElementById("producto-precio").textContent = "Precio: " + (precioData?.precioActual ?? "N/A") + "€";
    document.getElementById("producto-precio-descuento").textContent = precioData?.precioDescuento ? `Precio Descuento: ${precioData.precioDescuento}€` : "";
    document.getElementById("producto-precio-unidad").textContent = precioData?.precioUnidadLote ? `Precio por unidad/lote: ${precioData.precioUnidadLote}€` : "";
    document.getElementById("producto-unidad-lote").textContent = precioData?.unidadLote ? `Unidad/Lote: ${precioData.unidadLote}` : "";
    document.getElementById("producto-utilidad").textContent = "Descripción: " + (descripcion?.Utilidad || "Sin descripción");
    document.getElementById("producto-peso").textContent = "Peso: " + (producto.Peso || "N/A") + " " + (producto.UnidadPeso || "");
    document.getElementById("producto-estado").textContent = "Estado: " + (producto.Estado || "Sin stock");
    document.getElementById("producto-tipo").textContent = "Tipo: " + (descripcion?.Tipo || "N/A");
    document.getElementById("producto-subtipo").textContent = "Subtipo: " + (descripcion?.Subtipo || "N/A");
    document.getElementById("producto-supermercado").textContent = "Supermercado: " + (supermercado?.Nombre || "");
    document.getElementById("producto-ubicacion").textContent = "Ubicación del supermercado: " + (supermercado?.Ubicacion || "");
    document.getElementById("producto-pais-super").textContent = "País del supermercado: " + (supermercado?.Pais || "");
    document.getElementById("producto-proveedor").textContent = "Proveedor: " + (proveedor?.Nombre || "");
    document.getElementById("producto-pais-proveedor").textContent = "País del proveedor: " + (proveedor?.Pais || "");

    const historial = precioData?.precioHistorico?.length
      ? precioData.precioHistorico.map(h => `${h.fecha}: ${h.precio}€`).join("\n")
      : "No disponible";

    document.getElementById("producto-historico").textContent = "Precio histórico:\n" + historial;
  } catch (error) {
    console.error("❌ Error al cargar el producto:", error);
    Swal.fire("Error", "No se pudo cargar el producto", "error");
  }
}

// ==============================
// 📌 CARGAR OPCIONES EN SELECTS
// ==============================
async function cargarOpcionesEnSelects(configs) {
  try {
    for (const { campo, endpoint, usarId } of configs) {
      const response = await fetch(`http://localhost:3000/api/${endpoint}`);
      if (!response.ok) throw new Error(`No se pudo cargar ${campo}`);

      const datos = await response.json();
      const modos = ["edit"];

      modos.forEach((modo) => {
        const select = document.getElementById(`${modo}-${campo}-select`);
        if (!select) return;

        select.innerHTML = `<option value="">Selecciona una opción</option>`;

        datos.forEach((item) => {
          const option = document.createElement("option");
          option.value = usarId ? item._id : item.Nombre || item;
          option.textContent = item.Nombre || item;
          select.appendChild(option);
        });

        const optionOtro = document.createElement("option");
        optionOtro.value = "nuevo";
        optionOtro.textContent = "Otro (escribir nuevo)";
        select.appendChild(optionOtro);
      });
    }
  } catch (err) {
    console.error("❌ Error cargando selects dinámicos:", err);
  }
}

// ==============================
// ✏️ EDITAR PRODUCTO
// ==============================
document.getElementById("btn-editar-detalle").addEventListener("click", async () => {
  const id = new URLSearchParams(window.location.search).get("id");
  if (id) await editarProducto(id);
});

async function editarProducto(id) {
  try {
    await cargarOpcionesEnSelects([
      { campo: "supermercado", endpoint: "supermercados", usarId: true },
      { campo: "tipo", endpoint: "tipos", usarId: false },
      { campo: "subtipo", endpoint: "subtipos", usarId: false },
      { campo: "marca", endpoint: "marcas", usarId: false },
      { campo: "proveedor", endpoint: "proveedores", usarId: true },
    ]);

    const producto = await (await fetch(`${API_URL}/${id}`)).json();
    const precios = await (await fetch("http://localhost:3000/api/precios")).json();
    const descripcion = await (await fetch("http://localhost:3000/api/descripcion")).json();

    const precioData = precios.find(p => p.producto_id === id);
    const descripcionData = descripcion.find(d => d.Producto_id === producto.Nombre);

    safeSetValue("edit-producto-id", producto._id);
    safeSetValue("edit-nombre", producto.Nombre);
    safeSetValue("edit-marca-select", producto.Marca);
    safeSetValue("edit-tipo-select", descripcionData?.Tipo);
    safeSetValue("edit-subtipo-select", descripcionData?.Subtipo);
    safeSetValue("edit-peso", producto.Peso);
    safeSetValue("edit-precio", precioData?.precioActual);
    safeSetValue("edit-precioDescuento", precioData?.precioDescuento);
    safeSetValue("edit-unidadLote", precioData?.unidadLote);
    safeSetValue("edit-precioPorUnidad", precioData?.precioUnidadLote);
    safeSetValue("edit-estado", producto.Estado || "En stock");

    document.getElementById("modal-editar").style.display = "flex";
  } catch (err) {
    console.error("❌ Error al cargar producto para editar:", err);
    Swal.fire("Error", "No se pudo cargar el producto para edición.", "error");
  }
}

// ==============================
// 🗑️ ELIMINAR PRODUCTO
// ==============================
document.getElementById("btn-eliminar-detalle").addEventListener("click", async () => {
  const id = new URLSearchParams(window.location.search).get("id");
  if (id) await eliminarProducto(id);
});

async function eliminarProducto(id) {
  try {
    const confirm = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción eliminará el producto y sus datos asociados.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    await fetch(`http://localhost:3000/api/productos-completos/${id}`, { method: "DELETE" });

    Swal.fire("✅ Eliminado", "El producto fue eliminado correctamente", "success")
  .then(() => {
    // Si hay historial previo, volver
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Si no, por defecto redirige a producto.html
      window.location.href = "producto.html";
    }
  });

  } catch (err) {
    console.error("❌ Error al eliminar producto:", err);
    Swal.fire("Error", "Hubo un problema al eliminar el producto", "error");
  }
}

// ==============================
// 💾 GUARDAR CAMBIOS EN MODAL
// ==============================
async function guardarCambiosDesdeFormulario() {
  try {
    const id = document.getElementById("edit-producto-id").value;
    const formData = new FormData();

    formData.append("nombre", document.getElementById("edit-nombre").value);
    formData.append("marca", document.getElementById("edit-marca-select").value || "Sin marca");
    formData.append("peso", document.getElementById("edit-peso").value);
    formData.append("unidadPeso", document.getElementById("edit-unidadPeso").value);
    formData.append("estado", document.getElementById("edit-estado").value);
    formData.append("fechaActualizacion", new Date().toISOString());
    formData.append("supermercado", document.getElementById("edit-supermercado-select").value);
    formData.append("proveedor", document.getElementById("edit-proveedor-select").value);
    formData.append("usuario", JSON.parse(localStorage.getItem("usuario"))?._id);

    const imagenInput = document.getElementById("add-imagen");
    if (imagenInput?.files?.length > 0) {
      formData.append("Imagen", imagenInput.files[0]);
    }

    const resProducto = await fetch(`http://localhost:3000/api/productos-completos/${id}`, {
      method: "PUT",
      body: formData,
    });

    if (!resProducto.ok) throw new Error("Error al actualizar el producto");

    await fetch("http://localhost:3000/api/precios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        producto_id: id,
        precioActual: document.getElementById("edit-precio").value,
        precioDescuento: document.getElementById("edit-precioDescuento").value || "",
        unidadLote: document.getElementById("edit-unidadLote").value || "N/A",
        precioUnidadLote: document.getElementById("edit-precioPorUnidad").value || "",
        precioHistorico: document.getElementById("edit-precioHistorico").value || "",
      }),
    });

    await fetch("http://localhost:3000/api/descripcion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Producto_id: id,
        Tipo: document.getElementById("edit-tipo-select").value,
        Subtipo: document.getElementById("edit-subtipo-select").value,
        Utilidad: "",
      }),
    });

    Swal.fire("✅ Éxito", "Producto actualizado correctamente", "success");
    cerrarFormulario();
    cargarProducto();
  } catch (err) {
    console.error("❌ Error al actualizar producto:", err);
    Swal.fire("Error", "Hubo un problema al actualizar el producto.", "error");
  }
}

// ==============================
// 🔧 UTILIDADES
// ==============================
function safeSetValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value ?? "";
}

function toggleNuevoCampo(modo, campo) {
  const select = document.getElementById(`${modo}-${campo}-select`);
  const input = document.getElementById(`${modo}-${campo}-nuevo`);
  if (!select || !input) return;

  input.style.display = (select.value === "nuevo") ? "block" : "none";
  input.required = select.value === "nuevo";
  if (!input.required) input.value = "";
}

function mostrarFormularioAgregar() {
  document.getElementById("modal-agregar").style.display = "flex";
}

function cerrarFormularioAgregar() {
  document.getElementById("modal-agregar").style.display = "none";
}

function cerrarFormulario() {
  document.getElementById("modal-editar").style.display = "none";
}
function volver() {
  window.history.back();
}

// ==============================
// 🌍 GLOBAL EXPOSURE
// ==============================
window.volver = volver;
window.toggleNuevoCampo = toggleNuevoCampo;
window.guardarCambiosDesdeFormulario = guardarCambiosDesdeFormulario;
window.cerrarFormulario = cerrarFormulario;
window.eliminarProducto = eliminarProducto;
window.editarProducto = editarProducto;
window.mostrarFormularioAgregar = mostrarFormularioAgregar;
window.cerrarFormularioAgregar = cerrarFormularioAgregar;
