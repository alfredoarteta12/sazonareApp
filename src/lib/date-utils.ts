/**
 * Utilidades para el manejo de la zona horaria oficial de Colombia (America/Bogota - UTC-5)
 * Garantiza que en Vercel y servidores en la nube (que operan en UTC)
 * los balances financieros, registros del día y recibos coincidan siempre con la hora colombiana.
 */

export const ZONA_HORARIA_COLOMBIA = 'America/Bogota';
export const LOCALE_COLOMBIA = 'es-CO';

/**
 * Obtiene el rango exacto de inicio (00:00:00.000) y fin (23:59:59.999) del día en Colombia.
 */
export function getRangoDiaColombia(fechaReferencia: Date = new Date()): {
  inicio: Date;
  fin: Date;
} {
  // Formato YYYY-MM-DD en la zona horaria de Colombia
  const formateador = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_HORARIA_COLOMBIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const fechaString = formateador.format(fechaReferencia);

  const inicio = new Date(`${fechaString}T00:00:00.000-05:00`);
  const fin = new Date(`${fechaString}T23:59:59.999-05:00`);

  return { inicio, fin };
}

/**
 * Formatea la hora en zona horaria de Colombia (ej: "07:15 p. m.")
 */
export function formatearHoraColombia(
  fecha: Date | string,
  formato24h: boolean = false
): string {
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return new Intl.DateTimeFormat(LOCALE_COLOMBIA, {
    timeZone: ZONA_HORARIA_COLOMBIA,
    hour: '2-digit',
    minute: '2-digit',
    hour12: !formato24h,
  }).format(d);
}

/**
 * Formatea la fecha corta en zona horaria de Colombia (ej: "15/10/2026")
 */
export function formatearFechaColombia(fecha: Date | string): string {
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return new Intl.DateTimeFormat(LOCALE_COLOMBIA, {
    timeZone: ZONA_HORARIA_COLOMBIA,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/**
 * Formatea la fecha completa en palabras en zona horaria de Colombia (ej: "jueves, 15 de octubre de 2026")
 */
export function formatearFechaLargaColombia(fecha: Date = new Date()): string {
  return new Intl.DateTimeFormat(LOCALE_COLOMBIA, {
    timeZone: ZONA_HORARIA_COLOMBIA,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(fecha);
}

/**
 * Formatea fecha y hora combinada en Colombia (ej: "15/10/2026 07:15 p. m.")
 */
export function formatearFechaHoraColombia(fecha: Date | string): string {
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return new Intl.DateTimeFormat(LOCALE_COLOMBIA, {
    timeZone: ZONA_HORARIA_COLOMBIA,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}
