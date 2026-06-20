import { useSimulacion } from '../hooks/useSimulacion';
import { ParametrosForm } from './ParametrosForm';
import { PanelMetricas } from './PanelMetricas';
import { VectorEstado } from './VectorEstado';
import { FilaDetalleObjetos } from './FilaDetalleObjetos';
import { TablaRungeKutta } from './TablaRungeKutta';
import { num } from '@/shared/utils/format';
import '../simulacion.css';

export const SimulacionPage = () => {
  const sim = useSimulacion();
  const { resultado } = sim;

  const filaDetalle =
    resultado && sim.filaSeleccionada != null
      ? resultado.filas.find((f) => f.fila === sim.filaSeleccionada) ?? null
      : null;

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">
          Zapatería
          <small>Simulación de eventos discretos · TP</small>
        </h1>
        {resultado && (
          <div className="app__secado">
            tiempo de secado (RK4)
            <strong>{num(resultado.rk.tiempoSecadoMinutos, 1)} min</strong>
          </div>
        )}
      </header>

      <div className="layout">
        <aside>
          <ParametrosForm
            params={sim.paramsForm}
            onCambio={sim.actualizarParam}
            onEjecutar={sim.ejecutar}
            onRestablecer={sim.restablecer}
          />
        </aside>

        <div className="col-main">
          {!resultado ? (
            <div className="card placeholder">
              Configurá los parámetros y presioná <strong>&nbsp;Simular&nbsp;</strong> para
              generar el vector de estado.
            </div>
          ) : (
            <>
              <PanelMetricas metricas={resultado.metricas} motivo={resultado.motivoCorte} />

              <VectorEstado
                resultado={resultado}
                ventana={sim.ventana}
                setVentana={sim.setVentana}
                filasVisibles={sim.filasVisibles}
                filaSeleccionada={sim.filaSeleccionada}
                onSeleccionar={sim.setFilaSeleccionada}
              />

              <FilaDetalleObjetos fila={filaDetalle} />

              <TablaRungeKutta rk={resultado.rk} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
