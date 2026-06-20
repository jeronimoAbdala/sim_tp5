// ============================================================================
// Parámetros por defecto.
// El reloj se mide en MINUTOS desde la apertura (8:00 = minuto 0).
// Cierre de puerta: 16:00 = minuto 480.
// Estado inicial tomado del enunciado / planilla del TP.
// ============================================================================

import type { Parametros } from './types';

export const PARAMETROS_DEFAULT: Parametros = {
  // Llegadas: exponencial negativa, media 15 min.
  mediaLlegadas: 15,

  // Tipo: 50% Retiro / 50% Pedido.
  probRetiro: 0.5,

  // Atención: uniforme [2, 4] min.
  atencionMin: 2,
  atencionMax: 4,

  // Reparación: uniforme [7, 23] min (+ secado).
  reparacionMin: 7,
  reparacionMax: 23,

  // Runge-Kutta: dS/dt = 31·S + 5, h=0.01, S0=0, seco al superar 60.
  // 1 unidad de t = 60 min ⇒ secado ≈ 0.2 u = 12 min.
  rkH: 0.01,
  rkS0: 0,
  rkUmbralSeco: 60,
  rkMinutosPorUnidad: 60,

  // Horario: cierra a los 480 min (16:00).
  horaCierreMin: 480,

  // Estado inicial (Reloj en cero).
  zapatosListosIniciales: 10,
  pedidosEnReparacionIniciales: 3,
  clientesEsperandoIniciales: 1,
  hayClienteEnAtencionInicial: true,

  // Corte: por defecto, una jornada larga (hasta 12:00 hs de simulación)
  // y tope de 100.000 iteraciones.
  tiempoX: 720,
  maxIteraciones: 100000,

  // Reproducibilidad.
  semilla: 12345,
};
