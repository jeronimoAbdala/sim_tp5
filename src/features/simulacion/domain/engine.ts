// ============================================================================
// Motor de simulación por eventos discretos — Zapatería.
//
// Eventos: Llegada Cliente · Fin Atención Cliente · Fin Reparación.
// El próximo evento es el mínimo de los tres relojes futuros.
// Lógica validada contra la planilla de cálculo del TP.
// ============================================================================

import {
  Rng,
  exponencialNegativa,
  uniforme,
  sortearTipoCliente,
} from './rng';
import { resolverSecado } from './rungeKutta';
import { calcularMetricas } from './metrics';
import type {
  Parametros,
  FilaVector,
  ResultadoSimulacion,
  EstadoZapatero,
  TipoCliente,
  ClienteSnap,
  PedidoSnap,
  MotivoCorte,
  Evento,
} from './types';

const INF = Number.POSITIVE_INFINITY;

// --- Objetos internos (mutables durante la corrida) -------------------------

interface Cliente {
  id: number;
  tipo: TipoCliente;
  tiempoLlegada: number;
}

interface Pedido {
  id: number;
  tiempoInicio: number | null; // null = par ya listo al iniciar (sin origen)
}

// --- Estado completo del sistema -------------------------------------------

interface Estado {
  reloj: number;
  estado: EstadoZapatero;

  // llegadas
  proximaLlegada: number;

  // atención
  clienteEnAtencion: Cliente | null;
  colaClientes: Cliente[]; // esperando atención (EA)
  finAtencion: number;

  // reparación
  pedidoEnReparacion: Pedido | null;
  interrumpida: boolean; // el pedido en reparación quedó en RI
  tiempoFaltante: number;
  colaReparacion: Pedido[]; // esperando reparación (ER)
  finReparacion: number;

  // pares listos para retirar (LR)
  listos: Pedido[];

  // acumuladores
  acAtendiendo: number;
  acReparando: number;
  acLibre: number;
  acDespuesCierre: number;
  cantReparados: number;
  clientesPerdidos: number;

  // para promedios ponderados por tiempo
  areaColaClientes: number;
  areaColaReparacion: number;

  // generadores de id
  nextClienteId: number;
  nextPedidoId: number;
}

/** Datos del último sorteo, para volcarlos en la fila. */
interface UltimoSorteo {
  rndLlegada: number | null;
  tiempoEntreLlegadas: number | null;
  rndTipo: number | null;
  tipoCliente: TipoCliente | null;
  rndAtencion: number | null;
  demoraAtencion: number | null;
  rndReparacion: number | null;
  demoraReparacion: number | null;
}

function sorteoVacio(): UltimoSorteo {
  return {
    rndLlegada: null,
    tiempoEntreLlegadas: null,
    rndTipo: null,
    tipoCliente: null,
    rndAtencion: null,
    demoraAtencion: null,
    rndReparacion: null,
    demoraReparacion: null,
  };
}

// ============================================================================
// Simulación
// ============================================================================

export function simular(p: Parametros): ResultadoSimulacion {
  // 1) Runge-Kutta: tiempo de secado constante que se suma a cada reparación.
  const rk = resolverSecado({
    h: p.rkH,
    s0: p.rkS0,
    umbralSeco: p.rkUmbralSeco,
    minutosPorUnidad: p.rkMinutosPorUnidad,
  });
  const secado = rk.tiempoSecadoMinutos;

  const rng = new Rng(p.semilla);
  const filas: FilaVector[] = [];

  // 2) Estado inicial (Reloj en cero).
  const S = estadoInicial(p, rng, secado);
  const sorteoInicial = sorteoVacio();

  filas.push(construirFila(1, 'Inicialización', S, sorteoInicial));

  // 3) Bucle de eventos.
  let motivo: MotivoCorte = 'finTrabajo';
  let nroFila = 1;

  while (true) {
    if (nroFila >= p.maxIteraciones) {
      motivo = 'maxIteraciones';
      break;
    }

    const tProx = proximoEvento(S);

    // No quedan eventos: el sistema quedó vacío.
    if (tProx === INF) {
      motivo = 'finTrabajo';
      break;
    }

    // El próximo evento cae después de X ⇒ se corta en X.
    if (tProx > p.tiempoX) {
      avanzarReloj(S, p.tiempoX, p);
      nroFila += 1;
      filas.push(construirFilaCorte(nroFila, S));
      motivo = 'tiempoX';
      // En la fila de corte no se muestran objetos temporales (consigna).
      return armarResultado(p, filas, motivo, rk);
    }

    // Avanzar el reloj hasta el evento y acumular tiempos del estado anterior.
    avanzarReloj(S, tProx, p);
    const sorteo = sorteoVacio();

    if (tProx === S.proximaLlegada) {
      manejarLlegada(S, p, rng, sorteo);
      nroFila += 1;
      filas.push(construirFila(nroFila, 'Llegada Cliente', S, sorteo));
    } else if (tProx === S.finAtencion) {
      manejarFinAtencion(S, p, rng, secado, sorteo);
      nroFila += 1;
      filas.push(construirFila(nroFila, 'Fin Atención Cliente', S, sorteo));
    } else {
      manejarFinReparacion(S, p, rng, secado, sorteo);
      nroFila += 1;
      filas.push(construirFila(nroFila, 'Fin Reparación', S, sorteo));
    }
  }

  return armarResultado(p, filas, motivo, rk);
}

// ============================================================================
// Estado inicial
// ============================================================================

function estadoInicial(p: Parametros, rng: Rng, secado: number): Estado {
  const S: Estado = {
    reloj: 0,
    estado: 'Libre',
    proximaLlegada: INF,
    clienteEnAtencion: null,
    colaClientes: [],
    finAtencion: INF,
    pedidoEnReparacion: null,
    interrumpida: false,
    tiempoFaltante: 0,
    colaReparacion: [],
    finReparacion: INF,
    listos: [],
    acAtendiendo: 0,
    acReparando: 0,
    acLibre: 0,
    acDespuesCierre: 0,
    cantReparados: 0,
    clientesPerdidos: 0,
    areaColaClientes: 0,
    areaColaReparacion: 0,
    nextClienteId: 1,
    nextPedidoId: 1,
  };

  // Pares ya reparados al iniciar (Listos para Retirar, sin origen conocido).
  for (let k = 0; k < p.zapatosListosIniciales; k++) {
    S.listos.push({ id: S.nextPedidoId++, tiempoInicio: null });
  }

  // Pedidos en cola de reparación al iniciar.
  for (let k = 0; k < p.pedidosEnReparacionIniciales; k++) {
    S.colaReparacion.push({ id: S.nextPedidoId++, tiempoInicio: 0 });
  }

  // Primera llegada.
  const lleg = exponencialNegativa(rng, p.mediaLlegadas);
  S.proximaLlegada = lleg.valor >= p.horaCierreMin ? INF : lleg.valor;

  // ¿Hay un cliente siendo atendido en t = 0?
  if (p.hayClienteEnAtencionInicial) {
    const tipo = sortearTipoCliente(rng, p.probRetiro).valor;
    S.clienteEnAtencion = { id: S.nextClienteId++, tipo, tiempoLlegada: 0 };
    const at = uniforme(rng, p.atencionMin, p.atencionMax);
    S.finAtencion = at.valor;
    S.estado = 'Atendiendo';
  }

  // Clientes esperando atención al iniciar.
  for (let k = 0; k < p.clientesEsperandoIniciales; k++) {
    const tipo = sortearTipoCliente(rng, p.probRetiro).valor;
    S.colaClientes.push({ id: S.nextClienteId++, tipo, tiempoLlegada: 0 });
  }

  // Si no se atiende a nadie pero hay pedidos, arranca reparando.
  if (S.estado === 'Libre' && S.colaClientes.length === 0) {
    iniciarReparacionSiCorresponde(S, rng, p, secado);
  } else if (S.estado === 'Libre') {
    // Hay clientes esperando: arrancar atención del primero.
    iniciarAtencionSiguiente(S, rng, p);
  }

  return S;
}

// ============================================================================
// Reloj y acumuladores
// ============================================================================

function proximoEvento(S: Estado): number {
  return Math.min(S.proximaLlegada, S.finAtencion, S.finReparacion);
}

function avanzarReloj(S: Estado, nuevoReloj: number, p: Parametros): void {
  const delta = nuevoReloj - S.reloj;
  if (delta <= 0) {
    S.reloj = nuevoReloj;
    return;
  }

  // Acumular según el estado durante el intervalo.
  if (S.estado === 'Atendiendo') S.acAtendiendo += delta;
  else if (S.estado === 'Reparando') S.acReparando += delta;
  else S.acLibre += delta;

  // Tiempo transcurrido después del cierre (solape con [horaCierre, ∞)).
  const inicioCierre = Math.max(S.reloj, p.horaCierreMin);
  const solape = Math.max(0, nuevoReloj - inicioCierre);
  S.acDespuesCierre += solape;

  // Áreas para promedios de cola ponderados por tiempo.
  S.areaColaClientes += S.colaClientes.length * delta;
  S.areaColaReparacion += S.colaReparacion.length * delta;

  S.reloj = nuevoReloj;
}

// ============================================================================
// Manejadores de eventos
// ============================================================================

function manejarLlegada(
  S: Estado,
  p: Parametros,
  rng: Rng,
  sorteo: UltimoSorteo,
): void {
  // Tipo de cliente.
  const t = sortearTipoCliente(rng, p.probRetiro);
  sorteo.rndTipo = t.rnd;
  sorteo.tipoCliente = t.valor;

  // Decisión 2.A: un Retiro sin stock se va (no entra al sistema).
  const sinStock = t.valor === 'Retiro' && S.listos.length === 0;

  if (!sinStock) {
    const cliente: Cliente = {
      id: S.nextClienteId++,
      tipo: t.valor,
      tiempoLlegada: S.reloj,
    };

    if (S.estado === 'Libre') {
      S.clienteEnAtencion = cliente;
      arrancarAtencion(S, rng, p, sorteo);
    } else if (S.estado === 'Reparando') {
      // Interrumpe la reparación en curso; se reanudará al vaciar la cola.
      S.tiempoFaltante = S.finReparacion - S.reloj;
      S.interrumpida = true;
      S.finReparacion = INF;
      S.clienteEnAtencion = cliente;
      arrancarAtencion(S, rng, p, sorteo);
    } else {
      // Atendiendo: el cliente espera.
      S.colaClientes.push(cliente);
    }
  } else {
    S.clientesPerdidos += 1;
  }

  // Programar próxima llegada (cierra la puerta a la horaCierre).
  const lleg = exponencialNegativa(rng, p.mediaLlegadas);
  sorteo.rndLlegada = lleg.rnd;
  sorteo.tiempoEntreLlegadas = lleg.valor;
  const candidata = S.reloj + lleg.valor;
  S.proximaLlegada = candidata >= p.horaCierreMin ? INF : candidata;
}

function manejarFinAtencion(
  S: Estado,
  p: Parametros,
  rng: Rng,
  secado: number,
  sorteo: UltimoSorteo,
): void {
  const cliente = S.clienteEnAtencion;
  S.clienteEnAtencion = null;

  if (cliente) {
    if (cliente.tipo === 'Retiro') {
      // Entrega un par listo (si quedó alguno; si no, se va sin retirar).
      if (S.listos.length > 0) {
        S.listos.shift();
      } else {
        S.clientesPerdidos += 1;
      }
    } else {
      // Pedido: deja los zapatos ⇒ entran a la cola de reparación.
      S.colaReparacion.push({ id: S.nextPedidoId++, tiempoInicio: S.reloj });
    }
  }

  // ¿Quedan clientes esperando? El cliente tiene prioridad sobre la reparación.
  if (S.colaClientes.length > 0) {
    S.clienteEnAtencion = S.colaClientes.shift()!;
    arrancarAtencion(S, rng, p, sorteo);
  } else {
    S.finAtencion = INF;
    // Sin clientes: reanudar/iniciar reparación, o quedar libre.
    if (S.interrumpida) {
      reanudarReparacion(S);
    } else {
      iniciarReparacionSiCorresponde(S, rng, p, secado, sorteo);
    }
  }
}

function manejarFinReparacion(
  S: Estado,
  p: Parametros,
  rng: Rng,
  secado: number,
  sorteo: UltimoSorteo,
): void {
  // El par queda reparado ⇒ pasa a Listo para Retirar.
  if (S.pedidoEnReparacion) {
    S.listos.push({ id: S.pedidoEnReparacion.id, tiempoInicio: S.pedidoEnReparacion.tiempoInicio });
  }
  S.pedidoEnReparacion = null;
  S.interrumpida = false;
  S.tiempoFaltante = 0;
  S.cantReparados += 1;
  S.finReparacion = INF;

  // Si hay más pedidos (y no hay clientes, garantizado), seguir reparando.
  iniciarReparacionSiCorresponde(S, rng, p, secado, sorteo);
}

// ============================================================================
// Helpers de transición
// ============================================================================

function arrancarAtencion(
  S: Estado,
  rng: Rng,
  p: Parametros,
  sorteo: UltimoSorteo,
): void {
  const at = uniforme(rng, p.atencionMin, p.atencionMax);
  sorteo.rndAtencion = at.rnd;
  sorteo.demoraAtencion = at.valor;
  S.finAtencion = S.reloj + at.valor;
  S.estado = 'Atendiendo';
}

function iniciarAtencionSiguiente(S: Estado, rng: Rng, p: Parametros): void {
  if (S.colaClientes.length === 0) return;
  S.clienteEnAtencion = S.colaClientes.shift()!;
  const at = uniforme(rng, p.atencionMin, p.atencionMax);
  S.finAtencion = S.reloj + at.valor;
  S.estado = 'Atendiendo';
}

function reanudarReparacion(S: Estado): void {
  // Reanuda exactamente el tiempo que faltaba.
  S.finReparacion = S.reloj + S.tiempoFaltante;
  S.interrumpida = false;
  S.tiempoFaltante = 0;
  S.estado = 'Reparando';
}

function iniciarReparacionSiCorresponde(
  S: Estado,
  rng: Rng,
  p: Parametros,
  secado: number,
  sorteo?: UltimoSorteo,
): void {
  if (S.colaReparacion.length > 0) {
    S.pedidoEnReparacion = S.colaReparacion.shift()!;
    const rep = uniforme(rng, p.reparacionMin, p.reparacionMax);
    const demora = rep.valor + secado;
    if (sorteo) {
      sorteo.rndReparacion = rep.rnd;
      sorteo.demoraReparacion = demora;
    }
    S.finReparacion = S.reloj + demora;
    S.estado = 'Reparando';
  } else {
    S.estado = 'Libre';
  }
}

// ============================================================================
// Construcción de filas del vector de estado
// ============================================================================

function snapshotClientes(S: Estado): ClienteSnap[] {
  const out: ClienteSnap[] = [];
  if (S.clienteEnAtencion) {
    out.push({
      id: S.clienteEnAtencion.id,
      estado: 'SA',
      tipo: S.clienteEnAtencion.tipo,
      tiempoLlegada: S.clienteEnAtencion.tiempoLlegada,
    });
  }
  for (const c of S.colaClientes) {
    out.push({ id: c.id, estado: 'EA', tipo: c.tipo, tiempoLlegada: c.tiempoLlegada });
  }
  return out;
}

function snapshotPedidos(S: Estado): PedidoSnap[] {
  const out: PedidoSnap[] = [];
  if (S.pedidoEnReparacion) {
    out.push({
      id: S.pedidoEnReparacion.id,
      estado: S.interrumpida ? 'RI' : 'SR',
      tiempoInicio: S.pedidoEnReparacion.tiempoInicio,
    });
  }
  for (const pe of S.colaReparacion) {
    out.push({ id: pe.id, estado: 'ER', tiempoInicio: pe.tiempoInicio });
  }
  for (const pe of S.listos) {
    out.push({ id: pe.id, estado: 'LR', tiempoInicio: pe.tiempoInicio });
  }
  return out;
}

function construirFila(
  nro: number,
  evento: Evento,
  S: Estado,
  sorteo: UltimoSorteo,
): FilaVector {
  return {
    fila: nro,
    dia: 1,
    evento,
    reloj: S.reloj,
    rndLlegada: sorteo.rndLlegada,
    tiempoEntreLlegadas: sorteo.tiempoEntreLlegadas,
    proximaLlegada: S.proximaLlegada,
    rndTipo: sorteo.rndTipo,
    tipoCliente: sorteo.tipoCliente,
    colaClientes: S.colaClientes.length,
    estadoZapatero: S.estado,
    rndAtencion: sorteo.rndAtencion,
    demoraAtencion: sorteo.demoraAtencion,
    finAtencion: S.finAtencion,
    colaReparacion: S.colaReparacion.length,
    rndReparacion: sorteo.rndReparacion,
    demoraReparacion: sorteo.demoraReparacion,
    finReparacion: S.finReparacion,
    tiempoFaltanteReparacion: S.tiempoFaltante,
    zapatosListos: S.listos.length,
    cantReparados: S.cantReparados,
    clientesPerdidos: S.clientesPerdidos,
    tiempoAtendiendo: S.acAtendiendo,
    tiempoReparando: S.acReparando,
    tiempoLibre: S.acLibre,
    tiempoDespuesCierre: S.acDespuesCierre,
    clientes: snapshotClientes(S),
    pedidos: snapshotPedidos(S),
  };
}

/** Fila de corte en el instante X: sin objetos temporales (consigna). */
function construirFilaCorte(nro: number, S: Estado): FilaVector {
  const fila = construirFila(nro, 'Corte (X)', S, sorteoVacio());
  fila.clientes = [];
  fila.pedidos = [];
  return fila;
}

// ============================================================================
// Resultado
// ============================================================================

function armarResultado(
  _p: Parametros,
  filas: FilaVector[],
  motivo: MotivoCorte,
  rk: ResultadoSimulacion['rk'],
): ResultadoSimulacion {
  const ultima = filas[filas.length - 1];
  return {
    filas,
    filaFinal: ultima,
    motivoCorte: motivo,
    metricas: calcularMetricas(filas),
    rk,
  };
}
