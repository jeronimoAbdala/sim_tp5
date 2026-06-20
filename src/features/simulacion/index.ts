// Barrel export de la feature "simulación".
export { SimulacionPage } from './components/SimulacionPage';
export { simular } from './domain/engine';
export { resolverSecado } from './domain/rungeKutta';
export { PARAMETROS_DEFAULT } from './domain/defaults';
export type {
  Parametros,
  ResultadoSimulacion,
  FilaVector,
  Metricas,
} from './domain/types';
