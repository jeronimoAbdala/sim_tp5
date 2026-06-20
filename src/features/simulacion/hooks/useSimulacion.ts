// ============================================================================
// Hook de la feature: maneja el estado de UI y dispara el motor.
// No hay servidor ⇒ no usamos React Query; el "cómputo" es local y
// memoizado. Client state con useState/useMemo (permitido por la arquitectura).
// ============================================================================

import { useMemo, useState } from 'react';
import { simular } from '../domain/engine';
import { PARAMETROS_DEFAULT } from '../domain/defaults';
import type { Parametros, ResultadoSimulacion } from '../domain/types';

export interface VentanaVista {
  desde: number; // j: iteración inicial (1-based)
  cantidad: number; // i: cantidad de iteraciones a mostrar
}

export function useSimulacion() {
  // Parámetros editables (formulario).
  const [paramsForm, setParamsForm] = useState<Parametros>(PARAMETROS_DEFAULT);

  // Parámetros con los que se corrió efectivamente (se congelan al ejecutar).
  const [paramsCorrida, setParamsCorrida] = useState<Parametros | null>(null);

  // Ventana de visualización del vector de estado.
  const [ventana, setVentana] = useState<VentanaVista>({ desde: 1, cantidad: 15 });

  // Fila seleccionada (para el detalle de objetos temporales).
  const [filaSeleccionada, setFilaSeleccionada] = useState<number | null>(null);

  // Resultado de la corrida (memoizado por params).
  const resultado: ResultadoSimulacion | null = useMemo(() => {
    if (!paramsCorrida) return null;
    return simular(paramsCorrida);
  }, [paramsCorrida]);

  const ejecutar = () => {
    setParamsCorrida({ ...paramsForm });
    setFilaSeleccionada(null);
  };

  const actualizarParam = <K extends keyof Parametros>(clave: K, valor: Parametros[K]) => {
    setParamsForm((prev) => ({ ...prev, [clave]: valor }));
  };

  const restablecer = () => setParamsForm(PARAMETROS_DEFAULT);

  // Filas dentro de la ventana [desde, desde+cantidad).
  const filasVisibles = useMemo(() => {
    if (!resultado) return [];
    const ini = Math.max(0, ventana.desde - 1);
    const fin = ini + ventana.cantidad;
    return resultado.filas.slice(ini, fin);
  }, [resultado, ventana]);

  return {
    paramsForm,
    actualizarParam,
    restablecer,
    ejecutar,
    resultado,
    ventana,
    setVentana,
    filasVisibles,
    filaSeleccionada,
    setFilaSeleccionada,
  };
}
