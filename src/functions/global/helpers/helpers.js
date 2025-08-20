// ==============================
// 🛡️ Evita errores si un input no existe
// ==============================
export function safeSetValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value ?? "";
  else console.warn(`⚠️ Campo no encontrado: #${id}`);
}

// ==============================
// 🧩 TOGGLE ENTRE SELECT EXISTENTE E INPUT NUEVO
// - Si pasas un contenedorAdicionalId (p.ej. el bloque de ubicaciones),
//   lo muestra SOLO cuando el usuario elige "nuevo".
// ==============================
export function toggleNuevoCampo(modo, campo, contenedorAdicionalId = null) {
  const select = document.getElementById(`${modo}-${campo}-select`);
  const input  = document.getElementById(`${modo}-${campo}-nuevo`);
  const extra  = contenedorAdicionalId ? document.getElementById(contenedorAdicionalId) : null;

  if (!select || !input) {
    console.warn(`⚠️ toggleNuevoCampo: faltan #${modo}-${campo}-select o #${modo}-${campo}-nuevo`);
    return;
  }

  const esNuevo = select.value === "nuevo";

  input.style.display = esNuevo ? "block" : "none";
  input.required = esNuevo;
  if (!esNuevo) input.value = "";

  // 👉 importante: solo mostrar el contenedor extra si realmente es "nuevo"
  if (extra) extra.style.display = esNuevo ? "block" : "none";
}

// ==============================
// ➕ AÑADIR UN NUEVO GRUPO DE CAMPOS DE UBICACIÓN (editar)
// ==============================
export function agregarUbicacion() {
  const contenedor = document.getElementById("ubicaciones-container");
  if (!contenedor) return;
  const div = document.createElement("div");
  div.className = "ubicacion-grupo";
  div.innerHTML = `
    <input type="text" class="ubicacion" placeholder="Ubicación (ej: Calle Mayor 45)" />
    <input type="text" class="ciudad" placeholder="Ciudad (ej: Madrid)" />
    <input type="text" class="pais" placeholder="País (ej: España)" value="España" />
    <button type="button" onclick="eliminarUbicacion(this)">❌</button>
  `;
  contenedor.appendChild(div);
}

// ==============================
// ➕ AÑADIR UBICACIÓN EN MODAL "AGREGAR"
// ==============================
export function agregarUbicacionAdd() {
  const contenedor = document.getElementById("ubicaciones-container-add");
  if (!contenedor) return;
  const div = document.createElement("div");
  div.className = "ubicacion-grupo";
  div.innerHTML = `
    <input type="text" class="ubicacion" placeholder="Ubicación (ej: Calle Mayor 45)" />
    <input type="text" class="ciudad" placeholder="Ciudad (ej: Madrid)" />
    <input type="text" class="pais" placeholder="País (ej: España)" />
    <button type="button" onclick="eliminarUbicacion(this)">❌</button>
  `;
  contenedor.appendChild(div);
}

// ==============================
// 🗑️ ELIMINAR UN GRUPO DE UBICACIÓN (usado por onclick inline)
// Lo dejamos global para que el onclick lo encuentre.
// ==============================
export function eliminarUbicacion(btn) {
  btn?.closest(".ubicacion-grupo")?.remove();
}
// Hacerlo accesible para el HTML inline (al usar type="module" no es global)
if (typeof window !== "undefined") {
  window.eliminarUbicacion = eliminarUbicacion;
}

// ==============================
// 📊 Parsear string de precios históricos en pares {precio, anio}
// Acepta formatos con "€" y ":" (p.ej. "10€:2023, 12:2024")
// ==============================
export function parsearPrecioHistorico(input) {
  if (!input || typeof input !== "string") return [];
  const partes = input
    .replace(/€/g, "")
    .replace(/:/g, ",")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  const resultado = [];
  for (let i = 0; i < partes.length - 1; i += 2) {
    const precio = parseFloat(partes[i]);
    const anio = parseInt(partes[i + 1]);
    if (!isNaN(precio) && !isNaN(anio)) resultado.push({ precio, anio });
  }
  return resultado;
}

// ==============================
// 🧰 Helpers genéricos que usas al agregar producto
// ==============================
export const trimOrNull = (v) => {
  if (v === undefined || v === null) return null;
  const t = String(v).trim();
  return t === "" ? null : t;
};

export const numOrNull = (v) => {
  const n = Number(String(v ?? "").replace(",", ".").trim());
  return Number.isFinite(n) ? n : null;
};

/**
 * Lee “select + input nuevo” con patrón <modo>-<campo>-select / <modo>-<campo>-nuevo.
 * Por defecto, modo="add".
 */
export function valorOTextoNuevo(campo, modo = "add") {
  const sel = document.getElementById(`${modo}-${campo}-select`);
  const nuevo = document.getElementById(`${modo}-${campo}-nuevo`);
  if (!sel) return null;
  if (sel.value === "nuevo") return trimOrNull(nuevo?.value);
  return trimOrNull(sel.value);
}

// ==============================
// 🧹 Helpers de eliminación (usados en botons_eliminar)
// ==============================
export function quitarTarjetaDeDOM(id) {
  const card = document.querySelector(`[data-product-id="${id}"]`) || document.getElementById(id);
  if (card) card.remove();
}

export async function safeJson(res) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { raw: text }; }
}
