// ============================================================================
// Tipos del dominio de la simulación "Zapatería"
// (sin lógica: solo interfaces, tipos y enums del modelo)
// ============================================================================

/** Estado del único empleado (zapatero). */
export type EstadoZapatero = 'Libre' | 'Atendiendo' | 'Reparando';

/** Tipo de trámite que trae un cliente. */
export type TipoCliente = 'Retiro' | 'Pedido';

/** Estado de un objeto temporal "Cliente". */
export type EstadoCliente =
  | 'EA' // Esperando Atención
  | 'SA'; // Siendo Atendido

/** Estado de un objeto temporal "Pedido" (par de zapatos). */
export type EstadoPedido =
  | 'ER' // Esperando Reparación
  | 'SR' // Siendo Reparado
  | 'RI' // Reparación Interrumpida
  | 'LR'; // Listo para Retirar

/** Nombre del evento que generó la fila del vector de estado. */
export type Evento =
  | 'Inicialización'
  | 'Llegada Cliente'
  | 'Fin Atención Cliente'
  | 'Fin Reparación'
  | 'Corte (X)';

/** Por qué terminó la simulación. */
export type MotivoCorte =
  | 'tiempoX' // se alcanzó el tiempo X
  | 'maxIteraciones' // se alcanzaron las 100.000 (o N) iteraciones
  | 'finTrabajo'; // no quedan eventos pendientes (sistema vacío)

// ----------------------------------------------------------------------------
// Parámetros configurables por el usuario (consigna: todos modificables)
// ----------------------------------------------------------------------------

export interface Parametros {
  // --- Llegadas (exponencial negativa) ---
  mediaLlegadas: number; // minutos (media del exponencial)

  // --- Tipo de cliente (uniforme discreta) ---
  probRetiro: number; // 0..1 (prob. de que sea Retiro; el resto es Pedido)

  // --- Atención (uniforme continua) ---
  atencionMin: number; // a
  atencionMax: number; // b

  // --- Reparación (uniforme continua) ---
  reparacionMin: number; // a
  reparacionMax: number; // b

  // --- Secado del cemento (Runge-Kutta de dS/dt = 31·S + 5) ---
  rkH: number; // paso de integración h
  rkS0: number; // condición inicial S(0)
  rkUmbralSeco: number; // S por encima del cual el cemento está seco (60)
  rkMinutosPorUnidad: number; // a cuántos minutos equivale 1 unidad de t
  // (el tiempo de secado se calcula con RK4; se suma a cada reparación)

  // --- Horario ---
  horaCierreMin: number; // minuto en que cierra la puerta (8→16 hs = 480)

  // --- Estado inicial (Reloj en cero) ---
  zapatosListosIniciales: number; // pares ya reparados al iniciar (10)
  pedidosEnReparacionIniciales: number; // pedidos en cola de reparación
  clientesEsperandoIniciales: number; // clientes esperando atención al iniciar
  hayClienteEnAtencionInicial: boolean; // ¿hay un cliente siendo atendido en t=0?

  // --- Corte de la corrida ---
  tiempoX: number; // minutos: cortar al llegar a X
  maxIteraciones: number; // tope de filas del vector (≤ 100000)

  // --- Reproducibilidad ---
  semilla: number; // semilla del generador de números aleatorios
}

// ----------------------------------------------------------------------------
// Objetos temporales (snapshot por fila)
// ----------------------------------------------------------------------------

export interface ClienteSnap {
  id: number;
  estado: EstadoCliente;
  tipo: TipoCliente;
  tiempoLlegada: number;
}

export interface PedidoSnap {
  id: number;
  estado: EstadoPedido;
  /** Minuto en que entró a reparación; '-' para los pares ya listos al iniciar. */
  tiempoInicio: number | null;
}

// ----------------------------------------------------------------------------
// Una fila del vector de estado
// ----------------------------------------------------------------------------

export interface FilaVector {
  fila: number;
  dia: number;
  evento: Evento;
  reloj: number;

  // Llegada de cliente
  rndLlegada: number | null;
  tiempoEntreLlegadas: number | null;
  proximaLlegada: number;

  // Tipo de cliente
  rndTipo: number | null;
  tipoCliente: TipoCliente | null;

  // Atención
  colaClientes: number;
  estadoZapatero: EstadoZapatero;
  rndAtencion: number | null;
  demoraAtencion: number | null;
  finAtencion: number; // Infinity si no atiende

  // Reparación
  colaReparacion: number;
  rndReparacion: number | null;
  demoraReparacion: number | null; // incluye secado
  finReparacion: number; // Infinity si no repara
  tiempoFaltanteReparacion: number; // >0 si quedó interrumpida

  // Zapatos listos
  zapatosListos: number;

  // Acumuladores / contadores
  cantReparados: number;
  clientesPerdidos: number;
  tiempoAtendiendo: number;
  tiempoReparando: number;
  tiempoLibre: number;
  tiempoDespuesCierre: number;

  // Objetos temporales presentes (no se incluyen los que ya salieron)
  clientes: ClienteSnap[];
  pedidos: PedidoSnap[];
}

// ----------------------------------------------------------------------------
// Runge-Kutta
// ----------------------------------------------------------------------------

export interface FilaRK {
  i: number;
  ti: number;
  si: number;
  k1: number;
  k2: number;
  k3: number;
  k4: number;
  tiSig: number;
  siSig: number;
}

export interface ResultadoRK {
  filas: FilaRK[];
  tiempoSecadoMinutos: number; // resultado: cuánto demora en secar (se suma a reparar)
  tSeco: number; // valor de t (en unidades) donde S superó el umbral
}

// ----------------------------------------------------------------------------
// Resultado completo de una corrida
// ----------------------------------------------------------------------------

export interface Metricas {
  tiempoTotal: number;
  porcAtendiendo: number;
  porcReparando: number;
  porcLibre: number;
  cantReparados: number;
  clientesPerdidos: number;
  tiempoDespuesCierre: number;
  promedioColaClientes: number;
  promedioColaReparacion: number;
}

export interface ResultadoSimulacion {
  filas: FilaVector[];
  filaFinal: FilaVector;
  motivoCorte: MotivoCorte;
  metricas: Metricas;
  rk: ResultadoRK;
}
