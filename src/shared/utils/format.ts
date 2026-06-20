// ============================================================================
// Utilidades puras de formateo de números para la UI.
// ============================================================================

const INF = Number.POSITIVE_INFINITY;

/** Formatea un número con N decimales; ∞ y null se muestran como "-". */
export function num(valor: number | null | undefined, decimales = 2): string {
  if (valor === null || valor === undefined) return '-';
  if (valor === INF || !Number.isFinite(valor)) return '∞';
  return valor.toFixed(decimales);
}

/** Igual que num() pero deja vacío ("") en lugar de "-" para celdas sin sorteo. */
export function rnd(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return '';
  return valor.toFixed(4);
}

/** Convierte un minuto de simulación (desde 8:00) a hora reloj "HH:MM". */
export function aHora(minutos: number): string {
  if (!Number.isFinite(minutos)) return '∞';
  const base = 8 * 60; // 08:00
  const total = base + minutos;
  const h = Math.floor(total / 60) % 24;
  const m = Math.floor(total % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
