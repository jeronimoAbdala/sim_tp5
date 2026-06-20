import type { ResultadoRK } from '../domain/types';
import { num } from '@/shared/utils/format';

interface TablaRungeKuttaProps {
  rk: ResultadoRK;
}

export const TablaRungeKutta = ({ rk }: TablaRungeKuttaProps) => {
  return (
    <div className="card rk">
      <div className="card__title">Runge-Kutta · secado del cemento</div>
      <div className="rk__resumen">
        <span>
          Ecuación: <b>dS/dt = 31·S + 5</b>
        </span>
        <span>
          Seco en t = <b>{num(rk.tSeco, 3)}</b> u
        </span>
        <span>
          Tiempo de secado = <b>{num(rk.tiempoSecadoMinutos, 2)} min</b> (se suma a cada reparación)
        </span>
        <span>
          Pasos calculados: <b>{rk.filas.length}</b>
        </span>
      </div>

      <details className="rk-details" open>
        <summary>Ver tabla completa de iteraciones RK4</summary>
        <div style={{ overflow: 'auto', maxHeight: '50vh', marginTop: '0.7rem' }}>
          <table className="rk-table">
            <thead>
              <tr>
                <th>i</th>
                <th>tᵢ</th>
                <th>Sᵢ</th>
                <th>k₁</th>
                <th>k₂</th>
                <th>k₃</th>
                <th>k₄</th>
                <th>tᵢ₊₁</th>
                <th>Sᵢ₊₁</th>
              </tr>
            </thead>
            <tbody>
              {rk.filas.map((f) => (
                <tr key={f.i}>
                  <td>{f.i}</td>
                  <td>{num(f.ti, 3)}</td>
                  <td>{num(f.si, 6)}</td>
                  <td>{num(f.k1, 4)}</td>
                  <td>{num(f.k2, 4)}</td>
                  <td>{num(f.k3, 4)}</td>
                  <td>{num(f.k4, 4)}</td>
                  <td>{num(f.tiSig, 3)}</td>
                  <td>{num(f.siSig, 6)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
};
