// ==============================
// 🎛️ PROCESAR CAMPOS QUE PUEDEN SER NUEVOS
// ==============================
// Este método detecta si el usuario ha seleccionado "Otro (escribir nuevo)" en un select
// Si es así, inserta el nuevo dato en la base de datos y devuelve el ID o valor correspondiente
export async function procesarCampoNuevo(modo, campo, insertFn) {
    const select = document.getElementById(`${modo}-${campo}-select`);
    let valor = select?.value || "";
  
    if (valor === "nuevo") {
      const input = document.getElementById(`${modo}-${campo}-nuevo`);
      if (!input) throw new Error(`Campo nuevo para ${campo} no encontrado`);
      const nuevoValor = input.value.trim();
      if (!nuevoValor)
        throw new Error(`Debes ingresar un nuevo valor para ${campo}`);
      valor = await insertFn(nuevoValor); // Inserta y recupera el valor o ID
    }
  
    return valor;
  }