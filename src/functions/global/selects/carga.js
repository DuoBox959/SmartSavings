import { renderizarProductos } from "../modals/mostrar.js";
import { API_BASE } from "../UTILS/utils.js";

/* ==============================
   📥 Cargar datos dinámicos en selects
   configs: [{ campo, endpoint, usarId }]
   ============================== */
export async function cargarOpcionesEnSelects(configs) {
  try {
    const datosArray = await Promise.all(
      configs.map(({ endpoint, campo }) =>
        fetch(`${API_BASE}/api/${endpoint}`).then((r) => {
          if (!r.ok) throw new Error(`No se pudo cargar ${campo}`);
          return r.json();
        })
      )
    );

    configs.forEach(({ campo, usarId }, index) => {
      const datos = datosArray[index] ?? [];
      ["add", "edit"].forEach((modo) => {
        const sel = document.getElementById(`${modo}-${campo}-select`);
        if (!sel) return;

        const etiqueta = sel.querySelector("option[value='']")?.textContent || "Selecciona una opción";
        sel.innerHTML = `<option value="">${etiqueta}</option>`;

        datos.forEach((item) => {
          const value = usarId ? item._id : (item?.Nombre ?? item);
          const text  = item?.Nombre ?? item;
          if (!value || !text) return;
          const opt = document.createElement("option");
          opt.value = value;
          opt.textContent = text;
          sel.appendChild(opt);
        });

        const optNuevo = document.createElement("option");
        optNuevo.value = "nuevo";
        optNuevo.textContent = "Otro (escribir nuevo)";
        sel.appendChild(optNuevo);
      });
    });
  } catch (err) {
    console.error("❌ Error cargando selects dinámicos:", err);
  }
}

/* ==============================
   📥 Cargar productos para el listado principal
   ============================== */
export async function cargarProductos() {
  try {
    const [prRes, preRes] = await Promise.all([
      fetch(`${API_BASE}/api/productos`),
      fetch(`${API_BASE}/api/precios`),
    ]);
    const [productos, precios] = await Promise.all([prRes.json(), preRes.json()]);
    renderizarProductos(productos, precios);
  } catch (err) {
    console.error("Error cargando productos:", err);
  }
}

/* ==============================
   📥 Cargar y pintar detalle de un producto
   ============================== */
export async function cargarDetalleProductos() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id");
  if (!productId) return Swal.fire("Error", "No se especificó un producto", "error");

  try {
    // Trae lo necesario (la colección descripcion puede no existir; la tratamos como opcional)
    const [productoRes, preciosRes, supermercadosRes, proveedoresRes, descRes] =
      await Promise.all([
        fetch(`${API_BASE}/api/productos/${productId}`),
        fetch(`${API_BASE}/api/precios`),
        fetch(`${API_BASE}/api/supermercados`),
        fetch(`${API_BASE}/api/proveedor`),
        fetch(`${API_BASE}/api/descripcion`).catch(() => ({ ok: false, json: async () => [] })),
      ]);

    if (!productoRes.ok) throw new Error("Producto no encontrado");

    const producto      = await productoRes.json();
    const precios       = await preciosRes.json();
    const supermercados = await supermercadosRes.json();
    const proveedores   = await proveedoresRes.json();
    const descripciones = descRes.ok ? await descRes.json() : [];

    // Asociaciones
    const pidStr = String(producto._id);
    const precioData = precios.find(p => String(p.producto_id) === pidStr);
    const supermercado = supermercados.find(s =>
      String(s._id) === String(producto.Supermercado_id ?? producto.supermercado)
    );
    const proveedor = proveedores.find(p =>
      String(p._id) === String(producto.Proveedor_id ?? producto.proveedor)
    );

    // Si existe doc de descripcion lo usamos; si no, caemos al propio producto
    const descripcionDoc = descripciones.find(d => d.Producto_id === producto.Nombre) || {};
    const tipo       = descripcionDoc.Tipo       ?? producto.Tipo       ?? "No disponible";
    const subtipo    = descripcionDoc.Subtipo    ?? producto.Subtipo    ?? "No disponible";
    const utilidad   = descripcionDoc.Utilidad   ?? producto.Utilidad   ?? "Sin descripción";
    const ingredientesArr =
      descripcionDoc.Ingredientes ??
      (Array.isArray(producto.Ingredientes) ? producto.Ingredientes :
        (typeof producto.Ingredientes === "string"
          ? producto.Ingredientes.split(",").map(s => s.trim()).filter(Boolean)
          : []));

    // Imagen
    const img = document.getElementById("producto-imagen");
    if (img) {
      img.src = producto.Imagen?.startsWith("/uploads")
        ? `http://localhost:3000${producto.Imagen}`
        : "../assets/img/default.webp";
      img.alt = producto.Nombre || "Imagen del producto";
    }

    // Título (ojo: aquí es 'titulo-detalle')
    const titulo = document.getElementById("titulo-detalle");
    if (titulo) titulo.textContent = producto.Nombre || "Producto sin nombre";

    // Texto auxiliar
    const setHTML = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };

    // Datos “estáticos”
    setHTML("producto-marca",         `<strong>Marca:</strong> ${producto.Marca || "Desconocida"}`);
    setHTML("producto-tipo",          `<strong>Tipo:</strong> ${tipo}`);
    setHTML("producto-subtipo",       `<strong>Subtipo:</strong> ${subtipo}`);
    setHTML("producto-utilidad",      `<strong>Descripción:</strong> ${utilidad}`);
    setHTML("producto-ingredientes",  `<strong>Ingredientes:</strong> ${ingredientesArr.length ? ingredientesArr.join(", ") : "No disponible"}`);

    // Precios (con llaves que usas en tu BD)
    setHTML("producto-precio",            `<strong>Precio:</strong> ${precioData?.precioActual ?? "No disponible"} €`);
    setHTML("producto-precio-descuento",  precioData?.precioDescuento != null ? `<strong>Precio Descuento:</strong> ${precioData.precioDescuento} €` : "");
    setHTML("producto-precio-unidad",     precioData?.precioUnidadLote != null ? `<strong>Precio por unidad/lote:</strong> ${precioData.precioUnidadLote} €` : "");
    setHTML("producto-unidad-lote",       precioData?.unidadLote != null ? `<strong>Unidad/Lote:</strong> ${precioData.unidadLote}` : "");

    // Historial (aceptamos anio, año, ano, fecha, year)
    const historialTxt = (precioData?.precioHistorico ?? [])
      .map(h => {
        const year = h.anio ?? h["año"] ?? h.ano ?? h.fecha ?? h.year;
        const price = h.precio ?? h.valor ?? h.price;
        return (year != null && price != null) ? `${year}: ${price} €` : null;
      })
      .filter(Boolean)
      .join("<br>");
    setHTML("producto-historico", `<strong>Precio histórico:</strong><br>${historialTxt || "No disponible"}`);

    // Peso / estado
    setHTML("producto-peso",   `<strong>Peso:</strong> ${producto.Peso ?? "No disponible"} ${producto.UnidadPeso ?? ""}`);
    setHTML("producto-estado", `<strong>Estado:</strong> ${producto.Estado ?? "Sin stock"}`);

    // Supermercado + última ubicación conocida
    setHTML("producto-supermercado", `<strong>Supermercado:</strong> ${supermercado?.Nombre ?? "No disponible"}`);
    const u = (supermercado?.Ubicaciones || []).slice(-1)[0] || {};
    setHTML("producto-ubicacion",     `<strong>Ubicación del supermercado:</strong> ${u.Ubicacion ?? u.ubicacion ?? "No disponible"}`);
    setHTML("producto-pais-super",    `<strong>País del supermercado:</strong> ${u.Pais ?? u.pais ?? "No disponible"}`);
    setHTML("producto-ciudad-super",  `<strong>Ciudad del supermercado:</strong> ${u.Ciudad ?? u.ciudad ?? "No disponible"}`);

    // Proveedor
    setHTML("producto-proveedor",       `<strong>Proveedor:</strong> ${proveedor?.Nombre ?? "No disponible"}`);
    setHTML("producto-pais-proveedor",  `<strong>País del proveedor:</strong> ${proveedor?.Pais ?? proveedor?.pais ?? "No disponible"}`);

  } catch (error) {
    console.error("❌ Error al cargar el producto:", error);
    Swal.fire("Error", "No se pudo cargar el producto", "error");
  }
}


/* ==============================
   🔽 Pobladores dependientes de supermercado (UI)
   ============================== */
export function cargarUbicaciones(supermercado, pais, ciudad) {
  const ubicacionSelect = document.getElementById("add-ubicacion-existente");
  const nuevaUbicacionInput = document.getElementById("add-nueva-ubicacion");
  const labelNuevaUbicacion = document.getElementById("label-add-nueva-ubicacion");

  if (!ubicacionSelect) return;

  if (!supermercado || !pais || !ciudad) {
    ubicacionSelect.style.display = "none";
    if (nuevaUbicacionInput) nuevaUbicacionInput.style.display = "inline-block";
    if (labelNuevaUbicacion) labelNuevaUbicacion.style.display = "inline-block";
    return;
  }

  const ubicaciones = (supermercado.Ubicaciones || [])
    .filter((u) => u.Pais === pais && u.Ciudad === ciudad && typeof u.Ubicacion === "string")
    .map((u) => u.Ubicacion);

  if (ubicaciones.length === 0) {
    ubicacionSelect.style.display = "none";
    if (nuevaUbicacionInput) nuevaUbicacionInput.style.display = "inline-block";
    if (labelNuevaUbicacion) labelNuevaUbicacion.style.display = "inline-block";
    return;
  }

  ubicacionSelect.innerHTML = `<option value="">Selecciona una ubicación</option>`;
  ubicaciones.forEach((u) => {
    const opt = document.createElement("option");
    opt.value = u;
    opt.textContent = u;
    ubicacionSelect.appendChild(opt);
  });
  const optNuevo = document.createElement("option");
  optNuevo.value = "nuevo";
  optNuevo.textContent = "Otra (nueva ubicación)";
  ubicacionSelect.appendChild(optNuevo);
  ubicacionSelect.style.display = "inline-block";

  if (nuevaUbicacionInput) nuevaUbicacionInput.style.display = "none";
  if (labelNuevaUbicacion) labelNuevaUbicacion.style.display = "none";
}

/* ==============================
   🧭 Obtener ubicaciones del formulario (add/edit)
   ============================== */
export function obtenerUbicacionesGenerico(prefijo) {
  const paisSelect       = document.getElementById(`${prefijo}-pais-existente`);
  const ciudadSelect     = document.getElementById(`${prefijo}-ciudad-existente`);
  const ubicacionSelect  = document.getElementById(`${prefijo}-ubicacion-existente`);

  const paisInput        = document.getElementById(`${prefijo}-nuevo-pais`);
  const ciudadInput      = document.getElementById(`${prefijo}-nueva-ciudad`);
  const ubicacionInput   = document.getElementById(`${prefijo}-nueva-ubicacion`);

  const getVal = (sel, inp) =>
    sel?.value === "nuevo"
      ? (inp?.value || "").trim()
      : (sel?.value || "").trim();

  const pais       = getVal(paisSelect, paisInput);
  const ciudad     = getVal(ciudadSelect, ciudadInput);
  const ubicacion  = getVal(ubicacionSelect, ubicacionInput);

  // Validación estricta en "add"
  if (prefijo === "add") {
    const faltan = [];
    if (!pais) faltan.push("País");
    if (!ciudad) faltan.push("Ciudad");
    if (!ubicacion) faltan.push("Ubicación");
    if (faltan.length) {
      Swal.fire({
        icon: "warning",
        title: "Campos requeridos vacíos",
        html: `Has dejado vacío:<br><strong>${faltan.join("<br>")}</strong>`,
      });
      return [];
    }
  }

  // En "edit": solo devolvemos si hay los 3 valores
  const out = [];
  if (pais && ciudad && ubicacion) {
    // Usa mayúsculas para empatar con tu backend
    out.push({ Pais: pais, Ciudad: ciudad, Ubicacion: ubicacion });
  }
  return out;
}

/* ==============================
   🛒 Supermercados (caché simple)
   ============================== */
let cacheSupermercados = [];

export async function obtenerSupermercados() {
  if (cacheSupermercados.length > 0) return cacheSupermercados;
  const res = await fetch(`${API_BASE}/api/supermercados`);
  if (!res.ok) throw new Error("Error al cargar supermercados");
  const data = await res.json();
  cacheSupermercados = data;
  return data;
}

export function limpiarCacheSupermercados() {
  cacheSupermercados = [];
}

// útil para depuración en consola
window.renderizarProductos = renderizarProductos;
