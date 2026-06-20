// ============================================================================
// Runge-Kutta de 4° orden para el secado del cemento.
//   dS/dt = 31·S + 5
// Cuando S supera el umbral (60) el cemento está seco; ese instante (en t)
// se convierte a minutos y se suma al tiempo de cada reparación.
// La EDO es determinística ⇒ el tiempo de secado es constante en toda la corrida.
// ============================================================================

import type { FilaRK, ResultadoRK } from './types';

/** Lado derecho de la ecuación diferencial. */
function f(s: number): number {
  return 31 * s + 5;
}

interface ConfigRK {
  h: number;
  s0: number;
  umbralSeco: number;
  minutosPorUnidad: number;
}

export function resolverSecado(cfg: ConfigRK): ResultadoRK {
  const { h, s0, umbralSeco, minutosPorUnidad } = cfg;
  const filas: FilaRK[] = [];

  let ti = 0;
  let si = s0;
  let i = 0;
  let tSeco = 0;

  // Tope de seguridad por si los parámetros nunca cruzan el umbral.
  const MAX_PASOS = 100000;

  while (i < MAX_PASOS) {
    const k1 = f(si);
    const k2 = f(si + (h / 2) * k1);
    const k3 = f(si + (h / 2) * k2);
    const k4 = f(si + h * k3);

    const siSig = si + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
    const tiSig = ti + h;

    filas.push({ i, ti, si, k1, k2, k3, k4, tiSig, siSig });

    si = siSig;
    ti = tiSig;
    i += 1;

    if (si > umbralSeco) {
      tSeco = ti; // instante (en unidades de t) en que se considera seco
      break;
    }
  }

  return {
    filas,
    tSeco,
    tiempoSecadoMinutos: tSeco * minutosPorUnidad,
  };
}
