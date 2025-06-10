import { renderizarProductos} from "../modals/mostrar.js";
import { API_BASE } from "../UTILS/utils.js"; 

// 📥 Cargar datos dinámicos en los selects (tipo, marca, etc.)

export async function cargarOpcionesEnSelects(configs) { 

    try {
      const fetchPromises = configs.map(({ campo, endpoint }) =>
        fetch(`http://localhost:3000/api/${endpoint}`).then((response) => {
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
  
          // ➕ Opción para escribir un nuevo valor manualmente
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
// 📥 FUNCIONES DE CARGA Y LISTADO 
// ==============================

// 📥 Cargar productos y precios para renderizar en el listado principal
export async function cargarProductos() {
  try {
    const [productosRes, preciosRes] = await Promise.all([
      fetch("http://localhost:3000/api/productos"),
      fetch("http://localhost:3000/api/precios"),
    ]);
    const productos = await productosRes.json();
    const precios = await preciosRes.json();

    renderizarProductos(productos, precios);
  } catch (err) {
    console.error("Error cargando productos:", err);
  }
}


// ==============================
// 📥 CARGAR Y MOSTRAR PRODUCTO EN DETALLE
// ==============================
export async function cargarDetalleProductos() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id");

  if (!productId) {
    return Swal.fire("Error", "No se especificó un producto", "error");
  }

  try {
    const [productoRes, preciosRes, supermercadosRes, proveedoresRes, descRes] =
      await Promise.all([
        fetch(`<span class="math-inline">\{PRODUCTOS\_API\_URL\}/</span>{productId}`), 
        fetch(`${API_BASE}/api/precios`),
        fetch(`${API_BASE}/api/supermercados`),
        fetch(`${API_BASE}/api/proveedor`),
        fetch(`${API_BASE}/api/descripcion`),
      ]);

    if (!productoRes.ok) throw new Error("Producto no encontrado");

    const producto = await productoRes.json();
    const precios = await preciosRes.json();
    const supermercados = await supermercadosRes.json();
    const proveedores = await proveedoresRes.json();
    const descripciones = await descRes.json();

    const productoIdStr = producto._id?.toString();

    const precioData = precios.find(
      (p) => p.producto_id?.toString() === productoIdStr
    );
    const supermercado = supermercados.find(
      (s) => s._id?.toString() === producto.Supermercado_id?.toString()
    );
    const proveedor = proveedores.find(
      (p) => p._id?.toString() === producto.Proveedor_id?.toString()
    );
    const descripcion = descripciones.find(
      (d) => d.Producto_id === producto.Nombre
    );

    // Mostrar datos
    document.getElementById("producto-imagen").src =
      producto.Imagen || "../assets/img/default.webp";
    document.getElementById("producto-nombre").textContent =
      producto.Nombre || "Producto sin nombre";
    document.getElementById("producto-marca").innerHTML =
      "<strong>Marca:</strong>" + (producto.Marca || "Desconocida");
    document.getElementById("producto-precio").innerHTML =
      "<strong>Precio:</strong>" + (precioData?.precioActual ?? "N/A") + "€";
    document.getElementById("producto-precio-descuento").innerHTML =
      precioData?.precioDescuento
        ? `<strong>Precio Descuento:</strong> ${precioData.precioDescuento}€`
        : "";
    document.getElementById("producto-precio-unidad").innerHTML =
      precioData?.precioUnidadLote
        ? `<strong>Precio por unidad/lote:</strong> ${precioData.precioUnidadLote}€`
        : "";
    document.getElementById("producto-unidad-lote").innerHTML =
      precioData?.unidadLote
        ? `<strong>Unidad/Lote:</strong> ${precioData.unidadLote}`
        : "";
    document.getElementById("producto-utilidad").innerHTML =
      "<strong>Descripción:</strong>" +
      (descripcion?.Utilidad || "Sin descripción");
    document.getElementById("producto-peso").innerHTML =
      "<strong>Peso:</strong>" +
      (producto.Peso || "N/A") +
      " " +
      (producto.UnidadPeso || "");
    document.getElementById("producto-estado").innerHTML =
      "<strong>Estado:</strong>" + (producto.Estado || "Sin stock");
    document.getElementById("producto-tipo").innerHTML =
      "<strong>Tipo:</strong>" + (descripcion?.Tipo || "N/A");
    document.getElementById("producto-subtipo").innerHTML =
      "<strong>Subtipo:</strong> " + (descripcion?.Subtipo || "N/A");
    document.getElementById("producto-supermercado").innerHTML =
      "<strong>Supermercado:</strong> " + (supermercado?.Nombre || "");
      const ubicacion = supermercado?.Ubicaciones?.[0] || {};

      document.getElementById("producto-ubicacion").innerHTML =
        "<strong>Ubicación del supermercado:</strong> " +
        (ubicacion.Ubicacion || "N/A");
      
      document.getElementById("producto-pais-super").innerHTML =
        "<strong>País del supermercado:</strong> " +
        (ubicacion.Pais || "N/A");
      
      document.getElementById("producto-ciudad-super").innerHTML =
        "<strong>Ciudad del supermercado:</strong> " +
        (ubicacion.Ciudad || "N/A");
      
    document.getElementById("producto-proveedor").innerHTML =
      "<strong>Proveedor:</strong> " + (proveedor?.Nombre || "");
    document.getElementById("producto-pais-proveedor").innerHTML =
      "<strong>País del proveedor:</strong> " + (proveedor?.Pais || "");
    document.getElementById("producto-ingredientes").innerHTML =
      "<strong>Ingredientes:</strong> " +
      (descripcion?.Ingredientes?.join(", ") || "N/A");

    const historial = precioData?.precioHistorico?.length
      ? precioData.precioHistorico
          .map((h) => `${h.año || h.fecha || "¿Año?"}: ${h.precio}€`)
          .join("\n")
      : "No disponible";

    document.getElementById("producto-historico").innerHTML =
      "<strong>Precio histórico:</strong><br>" +
      historial.replace(/\n/g, "<br>");
  } catch (error) {
    console.error("❌ Error al cargar el producto:", error);
    Swal.fire("Error", "No se pudo cargar el producto", "error");
  }
}

export function cargarUbicaciones(supermercado, pais, ciudad) {
  const ubicacionSelect = document.getElementById("add-ubicacion-existente");
  const nuevaUbicacionInput = document.getElementById("add-nueva-ubicacion");
  const labelNuevaUbicacion = document.getElementById("label-add-nueva-ubicacion");

  if (!supermercado || !pais || !ciudad) {
    ubicacionSelect.style.display = "none";
    if (nuevaUbicacionInput) nuevaUbicacionInput.style.display = "inline-block";
    if (labelNuevaUbicacion) labelNuevaUbicacion.style.display = "inline-block";
    return;
  }

  const ubicaciones = supermercado.Ubicaciones
    .filter((u) => u.Pais === pais && u.Ciudad === ciudad && typeof u.Ubicacion === "string")
    .map((u) => u.Ubicacion);

  if (ubicaciones.length === 0) {
    ubicacionSelect.style.display = "none";
    if (nuevaUbicacionInput) nuevaUbicacionInput.style.display = "inline-block";
    if (labelNuevaUbicacion) labelNuevaUbicacion.style.display = "inline-block";
    return;
  }

  // Mostrar select con opciones existentes + opción de nueva
  ubicacionSelect.innerHTML = `<option value="">Selecciona una ubicación</option>`;
  ubicaciones.forEach((u) => {
    ubicacionSelect.innerHTML += `<option value="${u}">${u}</option>`;
  });
  ubicacionSelect.innerHTML += `<option value="nuevo">Otra (nueva ubicación)</option>`;
  ubicacionSelect.style.display = "inline-block";

  // Ocultar input manual hasta que se seleccione "nuevo"
  if (nuevaUbicacionInput) nuevaUbicacionInput.style.display = "none";
  if (labelNuevaUbicacion) labelNuevaUbicacion.style.display = "none";
}

export function obtenerUbicacionesGenerico(prefijo) {
  const ubicaciones = [];

  const pais = document.getElementById(`${prefijo}-pais-existente`)?.value === "nuevo"
    ? document.getElementById(`${prefijo}-nuevo-pais`).value.trim()
    : document.getElementById(`${prefijo}-pais-existente`).value;

  const ciudad = document.getElementById(`${prefijo}-ciudad-existente`)?.value === "nuevo"
    ? document.getElementById(`${prefijo}-nueva-ciudad`).value.trim()
    : document.getElementById(`${prefijo}-ciudad-existente`).value;

  let ubicacion = "";
  const ubicacionSelect = document.getElementById(`${prefijo}-ubicacion-existente`);

  if (ubicacionSelect?.value === "nuevo") {
    ubicacion = document.getElementById(`${prefijo}-nueva-ubicacion`).value.trim();
  } else {
    ubicacion = ubicacionSelect?.value;
  }

  if (pais && ciudad && ubicacion) {
    ubicaciones.push({ pais, ciudad, ubicacion });
  }

  return ubicaciones;
}

//OBTENER SUPERMERCADOS

// ==============================
// 🧠 CACHÉ LOCAL DE SUPERMERCADOS
// ==============================
let cacheSupermercados = [];

export async function obtenerSupermercados() {
  if (cacheSupermercados.length > 0) return cacheSupermercados;

  const res = await fetch("http://localhost:3000/api/supermercados");
  if (!res.ok) throw new Error("Error al cargar supermercados");
  const data = await res.json();
  cacheSupermercados = data;
  return data;
}

export function limpiarCacheSupermercados() {
  cacheSupermercados = [];
}


window.renderizarProductos = renderizarProductos;
