/**
 * Formateador oficial de moneda para Colombia (COP - Pesos Colombianos)
 *
 * En Colombia los precios no utilizan centavos decimales y se separan
 * los miles con puntos (.).
 * Ejemplos:
 *   18000   -> "$18.000"
 *   2500    -> "$2.500"
 *   1500000 -> "$1.500.000"
 */
export function formatearCOP(monto: number | null | undefined): string {
  if (monto === null || monto === undefined || isNaN(monto)) {
    return '$0';
  }
  return `$${Math.round(monto).toLocaleString('es-CO')}`;
}

/**
 * Formatea agregando explícitamente el código de divisa COP
 * Ejemplo: 18000 -> "$18.000 COP"
 */
export function formatearCOPCompleto(monto: number | null | undefined): string {
  return `${formatearCOP(monto)} COP`;
}

