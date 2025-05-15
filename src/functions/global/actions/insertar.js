// ==============================
// ➕ CREACIÓN DE NUEVO SUPERMERCADO
// ==============================
export async function insertarNuevoSupermercado(nombre, ubicacionesArray) {
  const res = await fetch("http://localhost:3000/api/supermercados", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      Nombre: nombre,
      Ubicaciones: ubicacionesArray, // Array de ubicaciones asociadas
    }),
  });

  if (!res.ok) throw new Error("Error al crear supermercado");

  const data = await res.json();
  return data.supermercado._id; // Retorna el ID del nuevo supermercado para usarlo en el formulario
}

// ==============================
// ➕ CREACIÓN DE NUEVO PROVEEDOR
// ==============================
export async function insertarNuevoProveedor(nombre, pais, comunidad = "N/A") {
  const res = await fetch("http://localhost:3000/api/proveedor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      Nombre: nombre,
      Pais: pais,
      "C.Autonoma": comunidad,
    }),
  });

  if (!res.ok) throw new Error("Error al crear proveedor");

  const data = await res.json();
  return data.proveedor._id; // Retorna el ID para asociarlo al producto
}

// ==============================
// ➕ CREACIÓN DE NUEVA MARCA
// ==============================
export async function insertarNuevaMarca(nombre) {
  const res = await fetch("http://localhost:3000/api/marcas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ Nombre: nombre }),
  });

  if (!res.ok) throw new Error("Error al crear marca");

  const data = await res.json();
  return data.marca?.Nombre || nombre; // O retorna _id si así lo maneja tu backend
}

// ==============================
// ➕ CREACIÓN DE NUEVO TIPO
// ==============================
export async function insertarNuevoTipo(nombre) {
  const res = await fetch("http://localhost:3000/api/tipos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ Nombre: nombre }),
  });

  if (!res.ok) throw new Error("Error al crear tipo");

  const data = await res.json();
  return data.tipo?.Nombre || nombre; // O data.tipo._id si el backend responde con ID
}

// ==============================
// ➕ CREACIÓN DE NUEVO SUBTIPO
// ==============================
export async function insertarNuevoSubtipo(nombre) {
  const res = await fetch("http://localhost:3000/api/subtipos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ Nombre: nombre }),
  });

  if (!res.ok) throw new Error("Error al crear subtipo");

  const data = await res.json();
  return data.subtipo?.Nombre || nombre;
}

