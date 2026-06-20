import type { Metricas, MotivoCorte } from '../domain/types';
import { num } from '@/shared/utils/format';

const MOTIVO_TEXTO: Record<MotivoCorte, string> = {
  tiempoX: 'Cortó por tiempo X',
  maxIteraciones: 'Cortó por máx. iteraciones',
  finTrabajo: 'Cortó al vaciar el sistema',
};

interface PanelMetricasProps {
  metricas: Metricas;
  motivo: MotivoCorte;
}

export const PanelMetricas = ({ metricas: m, motivo }: PanelMetricasProps) => {
  const items: { valor: string; label: string; acc?: boolean }[] = [
    { valor: `${num(m.porcAtendiendo, 1)}%`, label: 'Tiempo atendiendo' },
    { valor: `${num(m.porcReparando, 1)}%`, label: 'Tiempo reparando' },
    { valor: `${num(m.porcLibre, 1)}%`, label: 'Tiempo libre' },
    { valor: String(m.cantReparados), label: 'Pares reparados', acc: true },
    { valor: String(m.clientesPerdidos), label: 'Clientes perdidos', acc: true },
    { valor: `${num(m.tiempoDespuesCierre, 1)}`, label: 'Min. tras cierre', acc: true },
    { valor: num(m.promedioColaClientes, 2), label: 'Prom. cola clientes' },
    { valor: num(m.promedioColaReparacion, 2), label: 'Prom. cola reparación' },
  ];

  return (
    <div className="card metricas">
      <div className="card__title">
        Métricas
        <span className="corte-badge">{MOTIVO_TEXTO[motivo]} · {num(m.tiempoTotal, 1)} min</span>
      </div>
      <div className="metricas__grid">
        {items.map((it) => (
          <div className={`metric ${it.acc ? 'metric--acc' : ''}`} key={it.label}>
            <div className="metric__valor">{it.valor}</div>
            <div className="metric__label">{it.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
