// utils.js

function parsearPrecioHistorico(input) {
    if (!input || typeof input !== "string") return [];
  
    const partes = input.split(",").map(e => e.trim());
    const resultado = [];
  
    for (let i = 0; i < partes.length - 1; i += 2) {
      const precio = parseFloat(partes[i]);
      const año = parseInt(partes[i + 1]);
  
      if (!isNaN(precio) && !isNaN(año)) {
        resultado.push({ precio, año });
      }
    }
  
    return resultado;
  }
  
  module.exports = {
    parsearPrecioHistorico,
  };
  