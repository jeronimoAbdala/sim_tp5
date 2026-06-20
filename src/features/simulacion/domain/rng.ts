// ============================================================================
// Generador de números aleatorios (reproducible) + variables aleatorias.
// Cada sorteo devuelve { rnd, valor } para poder MOSTRAR el RND usado
// (consigna: "para cada variable aleatoria se debe mostrar el número
//  aleatorio que se usó para determinar su valor").
// ============================================================================

import type { TipoCliente } from './types';

const DECIMALES_RND = 4;

/** Redondea a 4 decimales: el valor de la VA se calcula con el RND ya truncado,
 *  así lo que se muestra reproduce exactamente lo que se usó. */
function redondearRnd(x: number): number {
  const f = 10 ** DECIMALES_RND;
  return Math.round(x * f) / f;
}

/**
 * Generador mulberry32: rápido, determinístico y suficiente para la cátedra.
 * Misma semilla ⇒ misma secuencia ⇒ corrida reproducible.
 */
export class Rng {
  private estado: number;

  constructor(semilla: number) {
    // Normalizamos la semilla a entero de 32 bits.
    this.estado = semilla >>> 0;
  }

  /** Próximo RND en [0, 1), truncado a 4 decimales. */
  siguiente(): number {
    this.estado |= 0;
    this.estado = (this.estado + 0x6d2b79f5) | 0;
    let t = Math.imul(this.estado ^ (this.estado >>> 15), 1 | this.estado);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    const r = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    return redondearRnd(r);
  }
}

export interface SorteoNumero {
  rnd: number;
  valor: number;
}

export interface SorteoTipo {
  rnd: number;
  valor: TipoCliente;
}

/** Exponencial negativa con media dada: -media · ln(1 − rnd). */
export function exponencialNegativa(rng: Rng, media: number): SorteoNumero {
  const rnd = rng.siguiente();
  const valor = -media * Math.log(1 - rnd);
  return { rnd, valor };
}

/** Uniforme continua en [a, b]: a + (b − a)·rnd. */
export function uniforme(rng: Rng, a: number, b: number): SorteoNumero {
  const rnd = rng.siguiente();
  const valor = a + (b - a) * rnd;
  return { rnd, valor };
}

/** Tipo de cliente: rnd < probRetiro ⇒ Retiro, si no ⇒ Pedido. */
export function sortearTipoCliente(rng: Rng, probRetiro: number): SorteoTipo {
  const rnd = rng.siguiente();
  const valor: TipoCliente = rnd < probRetiro ? 'Retiro' : 'Pedido';
  return { rnd, valor };
}
