import { API_BASE } from "/src/functions/global/UTILS/utils.js";

/* ==============================
   ➕ CREAR SUPERMERCADO
   - Ubicaciones: [{ Pais, Ciudad, Ubicacion }]
   ============================== */
export async function insertarNuevoSupermercado(nombre, ubicacionesArray = []) {
  // insertarNuevoSupermercado()
  const payload = {
    Nombre: nombre,
    Ubicaciones: (ubicacionesArray || [])
      .map(u => ({
        pais: u.pais || u.Pais || "",
        ciudad: u.ciudad || u.Ciudad || "",
        ubicacion: u.ubicacion || u.Ubicacion || "",
      }))
      .filter(u => u.pais && u.ciudad && u.ubicacion),
  };


  const res = await fetch(`${API_BASE}/api/supermercados`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al crear supermercado");

  return data.supermercado?._id || data._id;
}

/* ==============================
   🔄 AÑADIR UBICACIÓN A SUPERMERCADO
   - PATCH /api/supermercados/:id/ubicacion
   ============================== */
export async function aniadirUbicacionASupermercadoExistente(supermercadoId, ubicacion) {
  const nueva = {
    pais: ubicacion?.pais || ubicacion?.Pais,
    ciudad: ubicacion?.ciudad || ubicacion?.Ciudad,
    ubicacion: ubicacion?.ubicacion || ubicacion?.Ubicacion,
  };
  const res = await fetch(`${API_BASE}/api/supermercados/${supermercadoId}/ubicacion`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(nueva),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al añadir ubicación");

  return data.supermercado || data; // actualizado
}

/* ==============================
   ➕ CREAR PROVEEDOR
   - Tu doc de Proveedor es: { Nombre, Pais, C: { Autonoma } }
   - Evitamos la clave con punto "C.Autonoma" y mandamos un objeto anidado.
   ============================== */
export async function insertarNuevoProveedor(nombre, pais, comunidad = "") {
  const payload = { Nombre: nombre, Pais: pais };
  if (comunidad) payload.C = { Autonoma: comunidad };

  const res = await fetch(`${API_BASE}/api/proveedor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al crear proveedor");

  return data.proveedor?._id || data._id;
}

