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
// ==============================
export function toggleNuevoCampo(modo, campo) {
  const select = document.getElementById(`${modo}-${campo}-select`);
  const input = document.getElementById(`${modo}-${campo}-nuevo`);
  if (!select || !input) return;

  const esNuevo = select.value === "nuevo";
  input.style.display = esNuevo ? "block" : "none";
  input.required = esNuevo;
  if (!esNuevo) input.value = "";
}

// ==============================
// ➕ AÑADIR UN NUEVO GRUPO DE CAMPOS DE UBICACIÓN
// ==============================
export function agregarUbicacion() {
  const contenedor = document.getElementById("ubicaciones-container");
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

export function agregarUbicacionAdd() {
  const contenedor = document.getElementById("ubicaciones-container-add");
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
// 📊 Parsear string de precios históricos en pares [precio, año]
// ==============================
export function parsearPrecioHistorico(input) {
  if (!input || typeof input !== "string") return [];

  const partes = input.split(",").map((e) => e.trim());
  const resultado = [];

  for (let i = 0; i < partes.length - 1; i += 2) {
    const precio = parseFloat(partes[i]);
    const anio = parseInt(partes[i + 1]);

    if (!isNaN(precio) && !isNaN(anio)) {
      resultado.push({ precio, anio });
    }
  }

  return resultado;
}
