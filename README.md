# Zapatería · Simulador de eventos discretos

Aplicativo del TP: simula la atención de un **zapatero único** que atiende clientes
(retiros y pedidos) y repara calzado, con interrupción/reanudación de la reparación,
cierre de puerta y secado del cemento resuelto por **Runge-Kutta**.

La planilla original (`TP5.ods`) queda como **oráculo de validación**: la lógica de
eventos de este motor se cruzó fila por fila contra ella. El entregable es este
aplicativo, que supera la limitación de la planilla (se rompía con `#N/D` y nunca
llegaba al cierre).

---

## Cómo correr

Requiere **Node.js 18+**.

```bash
npm install
npm run dev      # servidor de desarrollo (Vite) → http://localhost:5173
```

Otros scripts:

```bash
npm run build    # type-check + build de producción en dist/
npm run preview  # sirve el build de producción
```

---

## Cómo se usa

1. Ajustá los **parámetros** en la columna izquierda (todos editables).
2. Presioná **Simular**.
3. Mirá las **métricas**, recorré el **vector de estado** y hacé **clic en cualquier
   fila** para ver los objetos temporales (clientes y pedidos) presentes en ese instante.
4. Controlá la ventana de visualización con **Desde (j)** y **Cantidad (i)**.
   La **última fila** (instante X) se muestra siempre, aunque la ventana no la incluya.
5. Abajo está la tabla completa de **Runge-Kutta** del secado.

---

## Arquitectura

Estructura **por feature** (Clean Architecture pragmática), siguiendo la convención
del equipo, con una adaptación justificada: **no hay backend**.

```
src/
├── features/simulacion/
│   ├── domain/          ← lógica pura del modelo (reemplaza a services/)
│   │   ├── types.ts         tipos e interfaces del dominio
│   │   ├── rng.ts           generador reproducible + variables aleatorias
│   │   ├── rungeKutta.ts    RK4 del secado del cemento
│   │   ├── engine.ts        motor de eventos discretos (simular)
│   │   ├── metrics.ts       cálculo de métricas
│   │   └── defaults.ts      parámetros por defecto
│   ├── hooks/
│   │   └── useSimulacion.ts estado de UI + corre el motor (useMemo)
│   ├── components/      ← UI exclusiva de la feature
│   ├── simulacion.css
│   └── index.ts         barrel
└── shared/utils/        ← utilidades genéricas (formateo)
```

**Adaptación a la arquitectura de referencia.** El skill del equipo asume apps con
servidor (React Query + Axios + React Router). Acá el cómputo es 100% local y
determinístico, así que:

- En lugar de `services/` con llamadas HTTP, hay un **`domain/`** de módulos TypeScript
  puros (el "servicio" es el propio motor de simulación).
- En lugar de **React Query** (estado de servidor), el resultado se memoiza con
  `useMemo` sobre los parámetros — es **client state**, que la propia guía resuelve con
  `useState`/`useMemo`.
- **Sin React Router**: es una sola pantalla.

Se mantiene lo no negociable: estructura por feature, separación de responsabilidades,
TypeScript estricto sin `any`, y `shared/` que nunca importa de `features/`.

---

## Modelo de la simulación

- **Reloj en minutos** desde la apertura (8:00 = minuto 0). Cierre de puerta a las
  16:00 = **minuto 480**.
- **Eventos**: Llegada Cliente · Fin Atención · Fin Reparación. El próximo evento es el
  mínimo de los tres relojes futuros.
- **Variables aleatorias** (se muestra el RND usado para cada una):
  - Llegadas: exponencial negativa, `-media·ln(1−rnd)`.
  - Tipo de cliente: uniforme, `rnd < probRetiro ⇒ Retiro`.
  - Atención: uniforme `[2, 4]` min.
  - Reparación: uniforme `[7, 23]` min **+ tiempo de secado**.
- **Prioridad clientes > reparación**: al llegar un cliente mientras se repara, se
  **interrumpe** la reparación (se guarda el tiempo faltante) y se **reanuda** exacto
  cuando se vacía la cola de clientes.
- **Secado (Runge-Kutta)**: `dS/dt = 31·S + 5`, RK4 con `h = 0.01`, seco al superar `S = 60`.
  Es determinístico ⇒ el tiempo de secado es **constante** (≈ 12 min con los valores por
  defecto) y se suma a cada reparación.

### Decisiones de modelado

Algunas reglas del enunciado admiten interpretación. Se tomaron estas (todas
**parametrizables** y fáciles de cambiar en el código si la cátedra define otra cosa):

- **(2.A) Retiro sin stock**: si llega un cliente de Retiro y **no hay pares listos**, se
  retira sin ser atendido y se cuenta como **cliente perdido**. Si había stock al llegar
  pero se agotó mientras esperaba, también se contabiliza como perdido al momento de ser
  atendido (el stock se descuenta recién en *Fin Atención*, como en la planilla, y nunca
  queda negativo).
- **(2.B) Cierre de puerta**: a partir del minuto 480 **no entran más clientes** (la
  próxima llegada que caería ≥ 480 se descarta). Las reparaciones pendientes **sí**
  continúan después del cierre; ese tiempo se mide en *Min. tras cierre*.
- **(2.C) Secado**: forma parte del tiempo de reparación (se suma a la demora del
  zapatero), no es un proceso en paralelo.
- **(2.D) Estado inicial**: 10 pares listos, 3 pedidos en cola de reparación, 1 cliente
  siendo atendido + 1 esperando (todo editable).
- **(2.E) Métricas**: porcentajes de uso del zapatero, pares reparados, clientes
  perdidos, tiempo tras el cierre y promedios de cola. **Conviene confirmar con la
  cátedra** el set exacto de métricas pedidas.

---

## Mapeo con las consignas

| Consigna | Dónde |
|---|---|
| Hasta 100.000 iteraciones **o** tiempo X (lo que ocurra primero) | `engine.ts` (bucle) + `maxIteraciones` / `tiempoX` |
| Mostrar **i** filas desde la **j** | controles *Desde (j)* / *Cantidad (i)* |
| Mostrar la **fila final** en X sin objetos temporales | fila *Corte (X)*, siempre visible |
| Todos los parámetros modificables | formulario *Parámetros* |
| Mostrar el **RND** de cada variable aleatoria | columnas RND (resaltadas) |
| Mostrar atributos de los **objetos** de una fila | panel *Objetos en el sistema* (clic en fila) |
| Mostrar la tabla de **Runge-Kutta** | panel *Runge-Kutta* |

---

## Reproducibilidad

El generador de números aleatorios está **sembrado** (parámetro *Semilla RND*). Con los
mismos parámetros y la misma semilla, la corrida es idéntica — útil para comparar contra
la planilla y para corregir.
# sim_tp5
