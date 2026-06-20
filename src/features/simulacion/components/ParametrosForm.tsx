import type { Parametros } from '../domain/types';

interface CampoNum {
  clave: keyof Parametros;
  label: string;
  step?: number;
  min?: number;
}

interface ParametrosFormProps {
  params: Parametros;
  onCambio: <K extends keyof Parametros>(clave: K, valor: Parametros[K]) => void;
  onEjecutar: () => void;
  onRestablecer: () => void;
}

const GRUPOS: { titulo: string; campos: CampoNum[] }[] = [
  {
    titulo: 'Llegadas',
    campos: [{ clave: 'mediaLlegadas', label: 'Media entre llegadas (min)', step: 1 }],
  },
  {
    titulo: 'Tipo de cliente',
    campos: [{ clave: 'probRetiro', label: 'Prob. de Retiro', step: 0.01, min: 0 }],
  },
  {
    titulo: 'Atención (uniforme)',
    campos: [
      { clave: 'atencionMin', label: 'Mínimo a (min)', step: 0.5 },
      { clave: 'atencionMax', label: 'Máximo b (min)', step: 0.5 },
    ],
  },
  {
    titulo: 'Reparación (uniforme)',
    campos: [
      { clave: 'reparacionMin', label: 'Mínimo a (min)', step: 0.5 },
      { clave: 'reparacionMax', label: 'Máximo b (min)', step: 0.5 },
    ],
  },
  {
    titulo: 'Secado — Runge-Kutta',
    campos: [
      { clave: 'rkH', label: 'Paso h', step: 0.001 },
      { clave: 'rkS0', label: 'S inicial S₀', step: 0.1 },
      { clave: 'rkUmbralSeco', label: 'Umbral seco (S>)', step: 1 },
      { clave: 'rkMinutosPorUnidad', label: 'Min por unidad t', step: 1 },
    ],
  },
  {
    titulo: 'Horario y estado inicial',
    campos: [
      { clave: 'horaCierreMin', label: 'Cierre puerta (min)', step: 10 },
      { clave: 'zapatosListosIniciales', label: 'Pares listos inic.', step: 1, min: 0 },
      { clave: 'pedidosEnReparacionIniciales', label: 'Pedidos en cola inic.', step: 1, min: 0 },
      { clave: 'clientesEsperandoIniciales', label: 'Clientes esperando inic.', step: 1, min: 0 },
    ],
  },
  {
    titulo: 'Corte y reproducibilidad',
    campos: [
      { clave: 'tiempoX', label: 'Tiempo X (min)', step: 10 },
      { clave: 'maxIteraciones', label: 'Máx. iteraciones', step: 1000, min: 1 },
      { clave: 'semilla', label: 'Semilla RND', step: 1 },
    ],
  },
];

export const ParametrosForm = ({
  params,
  onCambio,
  onEjecutar,
  onRestablecer,
}: ParametrosFormProps) => {
  return (
    <div className="card params">
      <div className="card__title">Parámetros</div>

      {GRUPOS.map((g) => (
        <div className="params__group" key={g.titulo}>
          <p className="params__group-title">{g.titulo}</p>
          {g.campos.map((c) => (
            <div className="field" key={String(c.clave)}>
              <label htmlFor={String(c.clave)}>{c.label}</label>
              <input
                id={String(c.clave)}
                type="number"
                step={c.step ?? 1}
                min={c.min}
                value={params[c.clave] as number}
                onChange={(e) => onCambio(c.clave, Number(e.target.value) as never)}
              />
            </div>
          ))}
        </div>
      ))}

      <div className="params__group">
        <div className="field">
          <label htmlFor="hayClienteEnAtencionInicial">Cliente en atención al iniciar</label>
          <input
            id="hayClienteEnAtencionInicial"
            type="checkbox"
            checked={params.hayClienteEnAtencionInicial}
            onChange={(e) => onCambio('hayClienteEnAtencionInicial', e.target.checked)}
          />
        </div>
      </div>

      <div className="params__actions">
        <button className="btn" onClick={onRestablecer}>
          Restablecer
        </button>
        <button className="btn btn--primary" onClick={onEjecutar}>
          Simular
        </button>
      </div>
    </div>
  );
};
