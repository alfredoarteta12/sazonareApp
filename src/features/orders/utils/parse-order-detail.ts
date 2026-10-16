export interface ItemDetallePedido {
  cantidad: number;
  nombre: string;
  adiciones?: string[];
  notas?: string;
  precioUnitario: number;
  subtotal: number;
}

/**
 * Parsea el texto del detalle de un pedido (ej: "2x Hamburguesa ($50.00), 1x Refresco ($20.00)")
 * tanto en formato simple como con modificadores, adiciones y notas de preparación.
 */
export function parseDetallePedido(detalle: string, total: number): ItemDetallePedido[] {
  if (!detalle || !detalle.trim()) return [];

  // 1. Limpiar notas de auditoría o tipo de pedido entre corchetes globales
  const textoLimpio = detalle
    .replace(/\[(CANCELADO|PAGADO|PARA LLEVAR|DOMICILIO)[^\]]*\]\s*/gi, '')
    .trim();

  // 2. Separar ítems usando lookahead para ", Nx " (para no romper notas que tengan comas internas)
  const partes = textoLimpio.split(/,\s*(?=\d+x\s)/i).filter(Boolean);

  const items: ItemDetallePedido[] = [];

  for (const parte of partes) {
    let str = parte.trim();

    // Extraer notas del ítem: {Nota: ...}
    let notas: string | undefined = undefined;
    const matchNota = str.match(/\{Nota:\s*([^}]+)\}/i);
    if (matchNota) {
      notas = matchNota[1].trim();
      str = str.replace(/\{Nota:\s*[^}]+\}/i, '').trim();
    }

    // Extraer adiciones del ítem: [+ ...]
    const adiciones: string[] = [];
    const matchAdic = str.match(/\[\+\s*([^\]]+)\]/i);
    if (matchAdic) {
      const adicRaw = matchAdic[1].trim();
      const lista = adicRaw.split(/\s*\+\s*/).filter(Boolean);
      for (const a of lista) {
        adiciones.push(`+ ${a.trim()}`);
      }
      str = str.replace(/\[\+\s*[^\]]+\]/i, '').trim();
    }

    // Limpiar notas residuales al final como "(Nota: ...)"
    str = str.replace(/\s*\(Nota:[^)]*\)/gi, '').trim();

    // Regex para coincidir con "2x Nombre del Producto ($45.50)" o "2x Nombre del Producto"
    const regex = /^(\d+)x\s+(.+?)(?:\s+\(\$([0-9.]+)\))?$/;
    const match = str.match(regex);

    if (match) {
      const cantidad = parseInt(match[1], 10) || 1;
      const nombre = match[2].trim();
      const precioUnitario = match[3] ? parseFloat(match[3]) : 0;
      const subtotal = precioUnitario > 0 ? cantidad * precioUnitario : 0;

      items.push({
        cantidad,
        nombre,
        adiciones: adiciones.length > 0 ? adiciones : undefined,
        notas,
        precioUnitario,
        subtotal,
      });
    } else {
      // Si no tiene el formato "Nx Nombre", lo agregamos como un ítem único
      items.push({
        cantidad: 1,
        nombre: str,
        adiciones: adiciones.length > 0 ? adiciones : undefined,
        notas,
        precioUnitario: 0,
        subtotal: 0,
      });
    }
  }

  // Si los precios no vinieron desglosados en el texto y solo hay 1 ítem, asignamos el total directo
  if (items.length === 1 && items[0].precioUnitario === 0 && total > 0) {
    items[0].precioUnitario = total / items[0].cantidad;
    items[0].subtotal = total;
  }

  return items;
}
