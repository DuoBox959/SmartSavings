// ==============================
// 📦 IMPORTACIONES
// ==============================
import { cargarHeaderFooter, volverAtras } from "../functions/global/funciones.js";
import { gestionarUsuarioAutenticado } from "../functions/global/header.js";


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
    document.getElementById("btn-eliminar-detalle").addEventListener("click", async () => {
      const productId = new URLSearchParams(window.location.search).get("id");
      if (!productId) {
        Swal.fire("Error", "ID de producto no encontrado", "error");
        return;
      }
    
      const confirm = await Swal.fire({
        title: "¿Estás seguro?",
        text: "Esta acción no se puede deshacer.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
      });
    
      if (!confirm.isConfirmed) return;
    
      try {
        const res = await fetch(`http://localhost:3000/api/productos-completos/${productId}`, {
          method: "DELETE",
        });
    
        if (!res.ok) throw new Error("Error al eliminar producto");
    
        await Swal.fire("✅ Eliminado", "Producto eliminado correctamente", "success");
    
        // 🔁 Redirigir al listado
        window.location.href = "../pages/productos.html";
      } catch (err) {
        console.error("❌ Error al eliminar:", err);
        Swal.fire("Error", "Hubo un problema al eliminar el producto.", "error");
      }
    });
    
        
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
    document.getElementById("producto-marca").innerHTML = "<strong>Marca:</strong>" + (producto.Marca || "Desconocida");
    document.getElementById("producto-precio").innerHTML = "<strong>Precio:</strong>" + (precioData?.precioActual ?? "N/A") + "€";
    document.getElementById("producto-precio-descuento").innerHTML = precioData?.precioDescuento ? `<strong>Precio Descuento:</strong> ${precioData.precioDescuento}€` : "";
    document.getElementById("producto-precio-unidad").innerHTML = precioData?.precioUnidadLote ? `<strong>Precio por unidad/lote:</strong> ${precioData.precioUnidadLote}€` : "";
    document.getElementById("producto-unidad-lote").innerHTML = precioData?.unidadLote ? `<strong>Unidad/Lote:</strong> ${precioData.unidadLote}` : "";
    document.getElementById("producto-utilidad").innerHTML = "<strong>Descripción:</strong>" + (descripcion?.Utilidad || "Sin descripción");
    document.getElementById("producto-peso").innerHTML = "<strong>Peso:</strong>" + (producto.Peso || "N/A") + " " + (producto.UnidadPeso || "");
    document.getElementById("producto-estado").innerHTML = "<strong>Estado:</strong>" + (producto.Estado || "Sin stock");
    document.getElementById("producto-tipo").innerHTML = "<strong>Tipo:</strong>" + (descripcion?.Tipo || "N/A");
    document.getElementById("producto-subtipo").innerHTML = "<strong>Subtipo:</strong> " + (descripcion?.Subtipo || "N/A");
    document.getElementById("producto-supermercado").innerHTML = "<strong>Supermercado:</strong> " + (supermercado?.Nombre || "");
    document.getElementById("producto-ubicacion").innerHTML = "<strong>Ubicación del supermercado:</strong> " + (supermercado?.Ubicacion || "");
    document.getElementById("producto-pais-super").innerHTML = "<strong>País del supermercado:</strong> " + (supermercado?.Pais || "");
    document.getElementById("producto-ciudad-super").innerHTML = "<strong>Ciudad del supermercado:</strong> " + (supermercado?.Ciudad || "");
    document.getElementById("producto-proveedor").innerHTML = "<strong>Proveedor:</strong> " + (proveedor?.Nombre || "");
    document.getElementById("producto-pais-proveedor").innerHTML = "<strong>País del proveedor:</strong> " + (proveedor?.Pais || "");
    document.getElementById("producto-ingredientes").innerHTML = "<strong>Ingredientes:</strong> " + (descripcion?.Ingredientes?.join(", ") || "N/A");

    const historial = precioData?.precioHistorico?.length
    ? precioData.precioHistorico.map(h => `${h.año || h.fecha || "¿Año?"}: ${h.precio}€`).join("\n")
    : "No disponible";

  
    document.getElementById("producto-historico").innerHTML =
    "<strong>Precio histórico:</strong><br>" + historial.replace(/\n/g, "<br>");
  
      
  } catch (error) {
    console.error("❌ Error al cargar el producto:", error);
    Swal.fire("Error", "No se pudo cargar el producto", "error");
  }
}


async function cargarOpcionesEnSelects(configs) {
  try {
    const fetchPromises = configs.map(({ campo, endpoint }) =>
      fetch(`http://localhost:3000/api/${endpoint}`).then(response => {
        if (!response.ok) throw new Error(`No se pudo cargar ${campo}`);
        return response.json();
      })
    );

    const datosArray = await Promise.all(fetchPromises);

    configs.forEach(({ campo, usarId }, index) => {
      const datos = datosArray[index];
      const modos = ["add", "edit"];

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

        // Opción para insertar nuevo
        const optionOtro = document.createElement("option");
        optionOtro.value = "nuevo"; 
        optionOtro.textContent = "Otro (escribir nuevo)";
        select.appendChild(optionOtro);
      });
    });
  } catch (err) {
    console.error("❌ Error cargando selects dinámicos:", err);
  }
}


// ==============================
// ✏️ EDICIÓN DE PRODUCTOS
// ==============================
async function editarProducto(id) {
  try {
    const producto = await (await fetch(`${API_URL}/${id}`)).json();
    const precios = await (await fetch(`http://localhost:3000/api/precios`)).json();
    const descripcion = await (await fetch(`http://localhost:3000/api/descripcion/producto/${id}`)).json();
    const supermercados = await (await fetch(`http://localhost:3000/api/supermercados`)).json();
    const proveedores = await (await fetch(`http://localhost:3000/api/proveedor`)).json();

    const precioData = precios.find(p => p.producto_id === id) || {};
    const supermercado = supermercados.find(s => s._id === producto.Supermercado_id) || {};
    const proveedor = proveedores.find(p => p._id === producto.Proveedor_id) || {};

    console.log("📦 Producto cargado:", producto);
    console.log("📊 Descripción cargada:", descripcion);

    // 📄 Llenar campos base
    safeSetValue("edit-producto-id", producto._id);
    safeSetValue("edit-nombre", producto.Nombre);
    safeSetValue("edit-marca-select", producto.Marca);
    safeSetValue("edit-peso", producto.Peso);
    safeSetValue("edit-unidadPeso", producto.UnidadPeso);
    safeSetValue("edit-estado", producto.Estado || "En stock");
    safeSetValue("edit-supermercado-select", supermercado._id);
    safeSetValue("edit-ubicacion-super", supermercado.Ubicacion);
    safeSetValue("edit-pais-super", supermercado.Pais);
    safeSetValue("edit-ciudad-super", supermercado.Ciudad || "");
    safeSetValue("edit-proveedor-select", proveedor._id);
    safeSetValue("edit-pais-proveedor", proveedor.Pais);
    safeSetValue("edit-fecha-subida", producto.fechaSubida);
    safeSetValue("edit-fecha-actualizacion", new Date().toISOString());
    safeSetValue("edit-usuario", producto.usuario);

    // 🧠 Cargar descripción
    safeSetValue("edit-tipo-select", descripcion.Tipo || "Sin tipo");
    safeSetValue("edit-subtipo-select", descripcion.Subtipo || "Sin subtipo");
    safeSetValue("edit-utilidad", descripcion.Utilidad || "Sin descripción");
    safeSetValue("edit-ingredientes", (descripcion.Ingredientes || []).join(", "));

    // 💰 Precios
    safeSetValue("edit-precio", precioData.precioActual);
    safeSetValue("edit-precioDescuento", precioData.precioDescuento);
    safeSetValue("edit-unidadLote", precioData.unidadLote);
    safeSetValue("edit-precioPorUnidad", precioData.precioUnidadLote);

    const historial = (precioData.precioHistorico || [])
      .map(entry => `${entry.precio}, ${entry.año}`)
      .join("\n");
    safeSetValue("edit-precioHistorico", historial);

    // Mostrar el formulario
    document.getElementById("modal-editar").style.display = "flex";

  } catch (err) {
    console.error("❌ Error al cargar producto para editar:", err);
    Swal.fire("Error", "Hubo un problema al cargar el producto para edición.", "error");
  }
}



// ==============================
// 💾 GUARDAR PRODUCTO  ACTUALIZADO
// ==============================

async function guardarCambiosDesdeFormulario() {
  try {
    const id = document.getElementById("edit-producto-id").value;
    const formData = new FormData();

    // 🧱 Campos base
    formData.append("nombre", document.getElementById("edit-nombre").value);
    formData.append("marca", document.getElementById("edit-marca-select").value || "Sin marca");
    formData.append("peso", document.getElementById("edit-peso").value);
    formData.append("unidadPeso", document.getElementById("edit-unidadPeso").value);
    formData.append("estado", document.getElementById("edit-estado").value);
    formData.append("fechaActualizacion", new Date().toISOString());
    // ✅ Campos que faltaban
    formData.append("tipo", document.getElementById("edit-tipo-select").value);
    formData.append("subtipo", document.getElementById("edit-subtipo-select").value || "");
    formData.append("precioActual", document.getElementById("edit-precio").value || "0");
   
    // ➕ NUEVOS CAMPOS (edición)
    formData.append("precioDescuento", document.getElementById("edit-precioDescuento")?.value || "");
    formData.append("unidadLote", document.getElementById("edit-unidadLote")?.value || "");
    formData.append("precioPorUnidad", document.getElementById("edit-precioPorUnidad")?.value || "");
    formData.append("utilidad", document.getElementById("edit-utilidad")?.value || "Sin descripción");
    formData.append("ubicacion", document.getElementById("edit-ubicacion-super")?.value || "");
    formData.append("ciudad", document.getElementById("edit-ciudad-super")?.value || "");
    formData.append("paisSupermercado", document.getElementById("edit-pais-super")?.value || "España");
    formData.append("paisProveedor", document.getElementById("edit-pais-proveedor")?.value || "España");

    // 🔗 IDs relacionados
    const supermercadoId = document.getElementById("edit-supermercado-select").value;
    const proveedorId = document.getElementById("edit-proveedor-select").value;
    const usuario = JSON.parse(sessionStorage.getItem("user"));
    const userId = usuario?._id || usuario?.id;
    
    formData.append("supermercado", supermercadoId);
    formData.append("proveedor", proveedorId);
    formData.append("usuario", userId);
   
    // 🖼️ Ingredientes

    const ingredientesInput = document.getElementById("edit-ingredientes").value;
    const ingredientesArray = ingredientesInput
    .split(",")
    .map(i => i.trim())
    .filter(i => i.length > 0);
    formData.append("ingredientes", ingredientesArray.join(","));

    // 🖼️ Imagen opcional
    const imagenInput = document.getElementById("edit-imagen");
    if (imagenInput?.files?.length > 0) {
      formData.append("Imagen", imagenInput.files[0]);
    }
    // Debug antes de enviar:
    console.log("📤 Datos enviados desde formulario de edición:");
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }

    // 🔄 1️⃣ Actualizar producto principal
    const productoRes = await fetch(`http://localhost:3000/api/productos-completos/${id}`, {
      method: "PUT",
      body: formData,
    });

    if (!productoRes.ok) throw new Error("Error al actualizar el producto");

    // 💸 2️⃣ Preparar precio histórico desde texto
    const historialTexto = document.getElementById("edit-precioHistorico").value;

    let historialArray = [];
    
    if (historialTexto.includes('\n')) {
      // 📄 Modo por líneas
      historialArray = historialTexto
        .split('\n')
        .map(linea => linea.split(',').map(e => e.trim()))
        .filter(arr => arr.length === 2)
        .map(([precio, año]) => ({
          precio: parseFloat(precio),
          año: parseInt(año)
        }));
    } else {
      // 📄 Modo todo en una línea
      const arr = historialTexto.split(',').map(e => e.trim());
      for (let i = 0; i < arr.length; i += 2) {
        if (arr[i + 1]) {
          historialArray.push({
            precio: parseFloat(arr[i]),
            año: parseInt(arr[i + 1])
          });
        }
      }
    }
    
   
    
    // 💰 3️⃣ Actualizar precio
    const precioData = {
      producto_id: id,
      precioActual: parseFloat(document.getElementById("edit-precio").value),
      precioDescuento: document.getElementById("edit-precioDescuento").value || null,
      unidadLote: document.getElementById("edit-unidadLote").value || "N/A",
      precioUnidadLote: parseFloat(document.getElementById("edit-precioPorUnidad").value || "0"),
      precioHistorico: historialArray
    };
    console.log("📊 Historial generado:", historialArray);
    console.log("📊 Payload completo precioData:", precioData);
    await fetch(`http://localhost:3000/api/precios/por-producto/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(precioData),
    });
    

    // 📝 4️⃣ Actualizar descripción con Utilidad incluida
    const descripcionData = {
      Producto_id: id,
      Tipo: document.getElementById("edit-tipo-select").value,
      Subtipo: document.getElementById("edit-subtipo-select").value,
      Utilidad: document.getElementById("edit-utilidad").value || "Sin descripción"
    };

    await fetch("http://localhost:3000/api/descripcion", {
      method: "POST", // Usa PUT si ya existe
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(descripcionData),
    });

    // 🎉 Éxito
    Swal.fire("✅ Éxito", "Producto actualizado completamente", "success");
    cerrarFormulario();
    await cargarProducto(); // Asegúrate de que esta función existe, si no, usa cargarProducto()

  } catch (err) {
    console.error("❌ Error al actualizar producto completo:", err);
    Swal.fire("Error", "Hubo un problema al actualizar el producto.", "error");
  }
}


// ==============================
// ➕ CREACIÓN DE RELACIONES DINÁMICAS
// ==============================
async function insertarNuevoSupermercado(nombre, pais, ubicacion = "", ciudad = "N/A") {
  const res = await fetch("http://localhost:3000/api/supermercados", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      Nombre: nombre,
      Pais: pais,
      Ciudad: ciudad,
      Ubicacion: [ubicacion]
    })
  });

  if (!res.ok) throw new Error("Error al crear supermercado");

  const data = await res.json();
  return data.supermercado._id;
}


async function insertarNuevoProveedor(nombre, pais, comunidad = "N/A") {
  const res = await fetch("http://localhost:3000/api/proveedor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ Nombre: nombre, Pais: pais, "C.Autonoma": comunidad })
  });

  if (!res.ok) throw new Error("Error al crear proveedor");
  const data = await res.json();
  return data.proveedor._id;
}

// ==============================
// 🧠 UTILIDADES Y FORMULARIO
// ==============================
async function insertarNuevaMarca(nombre) {
  return nombre;
}

async function insertarNuevoTipo(tipo) {
  return tipo;
}

async function insertarNuevoSubtipo(subtipo) {
  return subtipo;
}

function safeSetValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value ?? "";
  else console.warn(`⚠️ Campo no encontrado: #${id}`);
}

function toggleNuevoCampo(modo, campo) {
  const select = document.getElementById(`${modo}-${campo}-select`);
  const input = document.getElementById(`${modo}-${campo}-nuevo`);
  if (!select || !input) return;

  const esNuevo = select.value === "nuevo";
  input.style.display = esNuevo ? "block" : "none";
  input.required = esNuevo;
  if (!esNuevo) input.value = "";
}

function cerrarFormulario() {
  const form = document.getElementById("form-editar-producto");
  if (form) form.reset();
  document.getElementById("modal-editar").style.display = "none";
}

function cerrarFormularioAgregar() {
  const form = document.getElementById("form-agregar");
  if (form) form.reset();
  document.getElementById("modal-agregar").style.display = "none";
}

function mostrarFormularioAgregar() {
  document.getElementById("modal-agregar").style.display = "flex";
}
window.editarProductoFromHTML = function () {
  const productId = new URLSearchParams(window.location.search).get("id");
  if (productId) editarProducto(productId);
  else Swal.fire("Error", "ID de producto no encontrado", "error");
};

// ==============================
// 🗑️ ELIMINACIÓN DE PRODUCTO
// ==============================
async function eliminarProducto(id) {
  try {
    const confirm = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    // 🧨 Elimina todo desde tu endpoint central
    const res = await fetch(`http://localhost:3000/api/productos-completos/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) throw new Error("Error al eliminar producto completo");

    Swal.fire("✅ Eliminado", "Producto eliminado correctamente", "success");
    await cargarProducto(); // Volver a cargar los datos del producto actualizado
  } catch (err) {
    console.error("❌ Error al eliminar producto:", err);
    Swal.fire("Error", "Hubo un problema al eliminar el producto.", "error");
  }
}



// ==============================
// 🔁 EXPOSICIÓN GLOBAL PARA HTML
// ==============================
window.toggleNuevoCampo = toggleNuevoCampo;
window.cargarOpcionesEnSelects = cargarOpcionesEnSelects;
window.guardarCambiosDesdeFormulario = guardarCambiosDesdeFormulario;
window.cerrarFormularioAgregar = cerrarFormularioAgregar;
window.cerrarFormulario = cerrarFormulario;
window.editarProducto = editarProducto;
window.eliminarProducto = eliminarProducto;
window.mostrarFormularioAgregar = mostrarFormularioAgregar;
window.volverAtras = volverAtras;
