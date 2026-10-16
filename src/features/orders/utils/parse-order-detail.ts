export interface ItemDetallePedido {
  cantidad: number;
  nombre: string;
  precioUnitario: number;
  subtotal: number;
}

/**
 * Parsea el texto del detalle de un pedido (ej: "2x Hamburguesa ($50.00), 1x Refresco ($20.00)")
 * tanto en formato nuevo con precio como en formato antiguo simple ("2x Hamburguesa, 1x Refresco").
 */
export function parseDetallePedido(detalle: string, total: number): ItemDetallePedido[] {
  if (!detalle || !detalle.trim()) return [];

  // Si tiene notas de auditoría o tipo de pedido entre corchetes, las limpiamos para listar productos
  const textoLimpio = detalle
    .replace(/\[(CANCELADO|PAGADO|PARA LLEVAR|DOMICILIO)[^\]]*\]\s*/gi, '')
    .replace(/\s*\(Nota:[^)]*\)/gi, '')
    .trim();
  const partes = textoLimpio.split(', ').filter(Boolean);

  const items: ItemDetallePedido[] = [];

  for (const parte of partes) {
    // Regex para coincidir con "2x Nombre del Producto ($45.50)" o "2x Nombre del Producto"
    const regex = /^(\d+)x\s+(.+?)(?:\s+\(\$([0-9.]+)\))?$/;
    const match = parte.trim().match(regex);

    if (match) {
      const cantidad = parseInt(match[1], 10) || 1;
      const nombre = match[2].trim();
      const precioUnitario = match[3] ? parseFloat(match[3]) : 0;
      const subtotal = precioUnitario > 0 ? cantidad * precioUnitario : 0;

      items.push({
        cantidad,
        nombre,
        precioUnitario,
        subtotal,
      });
    } else {
      // Si no tiene el formato "Nx Nombre", lo agregamos como un ítem único
      items.push({
        cantidad: 1,
        nombre: parte.trim(),
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

