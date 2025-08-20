// ==============================
// 🎛️ PROCESAR CAMPOS QUE PUEDEN SER NUEVOS
// ==============================
// - Si el usuario elige "nuevo", lee el input <modo>-<campo>-nuevo.
// - Si se provee insertFn, la usa para crear y devuelve ID/valor.
// - Si no hay insertFn (p.ej. marca/tipo/subtipo en Productos), devuelve el texto nuevo.
// - Si el select no existe, devuelve null (caller decide).
export async function procesarCampoNuevo(
  modo,
  campo,
  insertFn = null,
  { prefer = "id" } = {} // prefer: "id" | "value"
) {
  const sel = document.getElementById(`${modo}-${campo}-select`);
  if (!sel) return null;

  const val = (sel.value ?? "").trim();

  // Si NO es "nuevo", devolvemos el valor tal cual (ID o string del select)
  if (val !== "nuevo") return val || null;

  // Es "nuevo": tomamos el input hermano
  const input = document.getElementById(`${modo}-${campo}-nuevo`);
  if (!input) throw new Error(`Campo nuevo para ${campo} no encontrado`);

  // Normalizamos el texto
  const nuevo = (input.value || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!nuevo) throw new Error(`Debes ingresar un nuevo valor para ${campo}`);

  // Si NO hay insertFn, devolvemos el string (para campos internos de Productos)
  if (typeof insertFn !== "function") return nuevo;

  // Con insertFn: creamos en BD y devolvemos ID/valor
  try {
    const res = await insertFn(nuevo);

    // Si insertFn retorna string (ya es ID o valor)
    if (typeof res === "string") return res;

    // Si retorna objeto, intentamos ID o nombre
    if (res && typeof res === "object") {
      if (prefer === "id" && (res._id || res.id)) return res._id || res.id;
      if (res.Nombre) return res.Nombre;
    }

    // Fallback: devuelve lo que vino o el texto nuevo
    return res ?? nuevo;
  } catch (e) {
    throw new Error(e?.message || `No se pudo crear el nuevo ${campo}`);
  }
}
