import type { FilaVector, ClienteSnap, PedidoSnap } from '../domain/types';
import { num } from '@/shared/utils/format';

const NOMBRE_ESTADO_CLIENTE: Record<ClienteSnap['estado'], string> = {
  EA: 'Esperando Atención',
  SA: 'Siendo Atendido',
};

const NOMBRE_ESTADO_PEDIDO: Record<PedidoSnap['estado'], string> = {
  ER: 'Esperando Reparación',
  SR: 'Siendo Reparado',
  RI: 'Reparación Interrumpida',
  LR: 'Listo para Retirar',
};

interface FilaDetalleObjetosProps {
  fila: FilaVector | null;
}

export const FilaDetalleObjetos = ({ fila }: FilaDetalleObjetosProps) => {
  if (!fila) {
    return (
      <div className="card detalle">
        <div className="card__title">Objetos en el sistema</div>
        <p className="detalle__vacio">Seleccioná una fila del vector para ver sus objetos.</p>
      </div>
    );
  }

  return (
    <div className="card detalle">
      <div className="detalle__head">
        <div className="card__title">Objetos en el sistema</div>
        <span className="detalle__reloj">
          fila {fila.fila} · reloj {num(fila.reloj)} min
        </span>
      </div>

      <div className="objetos-cols">
        <div className="objetos-col">
          <h4>Clientes ({fila.clientes.length})</h4>
          {fila.clientes.length === 0 ? (
            <p className="detalle__vacio">Sin clientes.</p>
          ) : (
            <div className="obj-chips">
              {fila.clientes.map((c) => (
                <div className="obj-chip" key={`c-${c.id}`}>
                  <span className="obj-chip__id">Cliente {c.id}</span>
                  <span className="obj-chip__meta">{c.tipo} · llegó {num(c.tiempoLlegada)}</span>
                  <span className={`obj-chip__estado est-${c.estado}`} title={NOMBRE_ESTADO_CLIENTE[c.estado]}>
                    {c.estado} · {NOMBRE_ESTADO_CLIENTE[c.estado]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="objetos-col">
          <h4>Pedidos ({fila.pedidos.length})</h4>
          {fila.pedidos.length === 0 ? (
            <p className="detalle__vacio">Sin pedidos.</p>
          ) : (
            <div className="obj-chips">
              {fila.pedidos.map((pe) => (
                <div className="obj-chip" key={`p-${pe.id}`}>
                  <span className="obj-chip__id">Pedido {pe.id}</span>
                  <span className="obj-chip__meta">
                    {pe.tiempoInicio === null ? 'inicial' : `inicio ${num(pe.tiempoInicio)}`}
                  </span>
                  <span className={`obj-chip__estado est-${pe.estado}`} title={NOMBRE_ESTADO_PEDIDO[pe.estado]}>
                    {pe.estado} · {NOMBRE_ESTADO_PEDIDO[pe.estado]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
