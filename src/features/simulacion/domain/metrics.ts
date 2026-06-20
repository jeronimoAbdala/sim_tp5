// ============================================================================
// Cálculo de métricas a partir del vector de estado completo.
// ============================================================================

import type { FilaVector, Metricas } from './types';

/** Promedio temporal de una cola (ponderado por el tiempo entre filas). */
function promedioPonderado(
  filas: FilaVector[],
  campo: 'colaClientes' | 'colaReparacion',
  T: number,
): number {
  let area = 0;
  for (let i = 1; i < filas.length; i++) {
    const dt = filas[i].reloj - filas[i - 1].reloj;
    area += filas[i - 1][campo] * dt;
  }
  return T > 0 ? area / T : 0;
}

export function calcularMetricas(filas: FilaVector[]): Metricas {
  const ultima = filas[filas.length - 1];
  const T = ultima.reloj || 1;

  return {
    tiempoTotal: ultima.reloj,
    porcAtendiendo: (ultima.tiempoAtendiendo / T) * 100,
    porcReparando: (ultima.tiempoReparando / T) * 100,
    porcLibre: (ultima.tiempoLibre / T) * 100,
    cantReparados: ultima.cantReparados,
    clientesPerdidos: ultima.clientesPerdidos,
    tiempoDespuesCierre: ultima.tiempoDespuesCierre,
    promedioColaClientes: promedioPonderado(filas, 'colaClientes', T),
    promedioColaReparacion: promedioPonderado(filas, 'colaReparacion', T),
  };
}
