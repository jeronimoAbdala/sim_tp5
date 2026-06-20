import type { FilaVector, ResultadoSimulacion } from '../domain/types';
import type { VentanaVista } from '../hooks/useSimulacion';
import { num, rnd as fmtRnd } from '@/shared/utils/format';

type TipoCol = 'dato' | 'rnd' | 'txt' | 'estado' | 'fila';

interface Columna {
  grupo: string;
  label: string;
  tipo: TipoCol;
  render: (f: FilaVector) => string;
}

const COLUMNAS: Columna[] = [
  { grupo: 'Evento', label: 'Fila', tipo: 'fila', render: (f) => String(f.fila) },
  { grupo: 'Evento', label: 'Evento', tipo: 'txt', render: (f) => f.evento },
  { grupo: 'Evento', label: 'Reloj', tipo: 'dato', render: (f) => num(f.reloj) },

  { grupo: 'Llegada cliente', label: 'RND', tipo: 'rnd', render: (f) => fmtRnd(f.rndLlegada) },
  { grupo: 'Llegada cliente', label: 'T. e/ lleg.', tipo: 'dato', render: (f) => num(f.tiempoEntreLlegadas) },
  { grupo: 'Llegada cliente', label: 'Próx. lleg.', tipo: 'dato', render: (f) => num(f.proximaLlegada) },

  { grupo: 'Tipo', label: 'RND', tipo: 'rnd', render: (f) => fmtRnd(f.rndTipo) },
  { grupo: 'Tipo', label: 'Retiro/Pedido', tipo: 'txt', render: (f) => f.tipoCliente ?? '-' },

  { grupo: 'Atención', label: 'Cola cli.', tipo: 'dato', render: (f) => String(f.colaClientes) },
  { grupo: 'Atención', label: 'Estado', tipo: 'estado', render: (f) => f.estadoZapatero },
  { grupo: 'Atención', label: 'RND', tipo: 'rnd', render: (f) => fmtRnd(f.rndAtencion) },
  { grupo: 'Atención', label: 'Demora at.', tipo: 'dato', render: (f) => num(f.demoraAtencion) },
  { grupo: 'Atención', label: 'Fin at.', tipo: 'dato', render: (f) => num(f.finAtencion) },

  { grupo: 'Reparación', label: 'Cola rep.', tipo: 'dato', render: (f) => String(f.colaReparacion) },
  { grupo: 'Reparación', label: 'RND', tipo: 'rnd', render: (f) => fmtRnd(f.rndReparacion) },
  { grupo: 'Reparación', label: 'Demora rep.', tipo: 'dato', render: (f) => num(f.demoraReparacion) },
  { grupo: 'Reparación', label: 'Fin rep.', tipo: 'dato', render: (f) => num(f.finReparacion) },
  { grupo: 'Reparación', label: 'T. faltante', tipo: 'dato', render: (f) => num(f.tiempoFaltanteReparacion) },

  { grupo: 'Sistema', label: 'Listos', tipo: 'dato', render: (f) => String(f.zapatosListos) },

  { grupo: 'Acumuladores', label: 'Reparados', tipo: 'dato', render: (f) => String(f.cantReparados) },
  { grupo: 'Acumuladores', label: 'Cli. perdidos', tipo: 'dato', render: (f) => String(f.clientesPerdidos) },
  { grupo: 'Acumuladores', label: 'T. atend.', tipo: 'dato', render: (f) => num(f.tiempoAtendiendo) },
  { grupo: 'Acumuladores', label: 'T. repar.', tipo: 'dato', render: (f) => num(f.tiempoReparando) },
  { grupo: 'Acumuladores', label: 'T. libre', tipo: 'dato', render: (f) => num(f.tiempoLibre) },
  { grupo: 'Acumuladores', label: 'T. post-cierre', tipo: 'dato', render: (f) => num(f.tiempoDespuesCierre) },
];

/** Agrupa columnas consecutivas para el header de grupos (colSpan). */
function gruposConSpan() {
  const out: { grupo: string; span: number }[] = [];
  for (const c of COLUMNAS) {
    const ult = out[out.length - 1];
    if (ult && ult.grupo === c.grupo) ult.span += 1;
    else out.push({ grupo: c.grupo, span: 1 });
  }
  return out;
}

function claseCelda(tipo: TipoCol): string {
  if (tipo === 'rnd') return 'rnd';
  if (tipo === 'txt' || tipo === 'estado') return 'txt';
  if (tipo === 'fila') return 'sticky-col';
  return 'dato';
}

function Celda({ col, fila }: { col: Columna; fila: FilaVector }) {
  const cls = claseCelda(col.tipo);
  if (col.tipo === 'estado') {
    return (
      <td className="txt">
        <span className={`estado-chip ${fila.estadoZapatero}`}>{fila.estadoZapatero}</span>
      </td>
    );
  }
  return <td className={cls}>{col.render(fila)}</td>;
}

interface VectorEstadoProps {
  resultado: ResultadoSimulacion;
  ventana: VentanaVista;
  setVentana: (v: VentanaVista) => void;
  filasVisibles: FilaVector[];
  filaSeleccionada: number | null;
  onSeleccionar: (fila: number) => void;
}

export const VectorEstado = ({
  resultado,
  ventana,
  setVentana,
  filasVisibles,
  filaSeleccionada,
  onSeleccionar,
}: VectorEstadoProps) => {
  const total = resultado.filas.length;
  const grupos = gruposConSpan();
  const filaFinal = resultado.filaFinal;
  // La fila final ya está en filasVisibles solo si cae dentro de la ventana.
  const finalEnVentana = filasVisibles.some((f) => f.fila === filaFinal.fila);

  const renderFila = (f: FilaVector) => (
    <tr
      key={f.fila}
      className={[
        f.fila === filaSeleccionada ? 'sel' : '',
        f.evento === 'Corte (X)' ? 'corte' : '',
      ]
        .join(' ')
        .trim()}
      onClick={() => onSeleccionar(f.fila)}
    >
      {COLUMNAS.map((c, i) =>
        c.tipo === 'fila' ? (
          <td key={i} className="sticky-col">
            {f.fila}
          </td>
        ) : (
          <Celda key={i} col={c} fila={f} />
        ),
      )}
    </tr>
  );

  return (
    <div className="card">
      <div className="ventana-bar">
        <div className="field">
          <label htmlFor="j">Desde (j)</label>
          <input
            id="j"
            type="number"
            min={1}
            max={total}
            value={ventana.desde}
            onChange={(e) => setVentana({ ...ventana, desde: Math.max(1, Number(e.target.value)) })}
          />
        </div>
        <div className="field">
          <label htmlFor="i">Cantidad (i)</label>
          <input
            id="i"
            type="number"
            min={1}
            value={ventana.cantidad}
            onChange={(e) =>
              setVentana({ ...ventana, cantidad: Math.max(1, Number(e.target.value)) })
            }
          />
        </div>
        <span className="ventana-info">
          {total.toLocaleString('es-AR')} filas totales · mostrando{' '}
          {Math.min(ventana.desde, total)}–{Math.min(ventana.desde + ventana.cantidad - 1, total)} ·
          clic en una fila para ver objetos
        </span>
      </div>

      <div className="tabla-wrap">
        <table className="vector">
          <thead>
            <tr className="grupos">
              {grupos.map((g, i) => (
                <th key={i} className={i === 0 ? 'sticky-col' : ''} colSpan={g.span}>
                  {g.grupo}
                </th>
              ))}
            </tr>
            <tr className="cols">
              {COLUMNAS.map((c, i) => (
                <th key={i} className={c.tipo === 'fila' ? 'sticky-col' : ''}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filasVisibles.map(renderFila)}

            {/* La última fila (instante X) siempre visible, aunque la ventana
                no la incluya — sin objetos temporales (consigna). */}
            {!finalEnVentana && (
              <>
                <tr>
                  <td className="sticky-col" />
                  <td colSpan={COLUMNAS.length - 1} className="txt" style={{ textAlign: 'center', color: 'var(--ink-faint)' }}>
                    ⋯ última fila ⋯
                  </td>
                </tr>
                {renderFila(filaFinal)}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
