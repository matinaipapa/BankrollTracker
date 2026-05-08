# 🃏 Bankroll Tracker (GGPoker Edition)

Una potente aplicación web ligera diseñada específicamente para jugadores de póker en **GGPoker** que desean un control granular y avanzado de su bankroll, torneos y rentabilidad. Esta herramienta procesa los historiales exportados por el cliente oficial (archivos `.txt` y `.zip`) y renderiza estadísticas avanzadas, gráficas de evolución, y filtros ultra personalizables.

---

## ✨ Características Principales

### 📈 Dashboard Analítico y Estadísticas
El Tracker genera un resumen dinámico que se actualiza **en tiempo real** en base a los filtros que apliques:

| Stat | Descripción |
|---|---|
| **Profit Total** | Ganancias netas: Total Cobrado − Total Invertido (buy-ins + re-entrys). |
| **ROI** | Return on Investment: `(Profit ÷ Invertido) × 100`. Un ROI de 50% = $0.50 extra por cada $1. |
| **ITM%** | In The Money: % de torneos donde cobraste ≥ tu entrada. Buen ITM en MTT: 15-20%. |
| **Avg Buy-in** | Promedio del costo de tus entradas. Indica en qué rango de stakes jugás. |
| **Mayor Ganancia** | Tu mejor cobro neto en un solo torneo. |
| **Puestos Premiados** | Total de veces que cobraste (ITM count). |
| **Buy-in Más Alto** | El torneo más caro en el que participaste. |
| **Buy-ins Totales** | Suma total de todo lo invertido (capital en riesgo acumulado). |
| **Final Tables** | Cantidad de veces en Top 9 con 18+ jugadores. Indicador de consistencia. |
| **Torneos Jugados** | Contador total de torneos según los filtros activos. |
| **🔥 Racha Actual** | Sesiones (días) consecutivas positivas o negativas. Motivación psicológica. |
| **📉 Max Drawdown** | Mayor caída acumulada desde un pico de bankroll. Cuanto menor, más estable tu juego. |

> 💡 **Tooltips:** Pasá el mouse por cualquier tarjeta de stats para ver una explicación detallada de cómo se calcula.

### 📊 Gráfico de Profit por Tipo de Torneo
Un gráfico de barras que muestra visualmente dónde ganás y dónde perdés plata:
- **Barras verdes** = tipos de torneo rentables.
- **Barras rojas** = tipos de torneo donde estás perdiendo.
- Se actualiza dinámicamente con los filtros activos.

### 📋 Tabla de ROI por Tipo
Al lado del gráfico, una tabla detallada con:
- **Tipo** | **Torneos** | **Invertido** | **Cobrado** | **Profit** | **ROI%**
- Ordenada de mayor a menor profit para que identifiques rápido dónde enfocarte.
- Clasifica automáticamente: Clásico, Bounty/PKO, Turbo, Hyper, Turbo Bounty, Hyper Bounty, GG Series, WSOP, Satélite, T$ Builder, Flipout/Free.

### ⚠️ Alerta de Bankroll Management
Sistema automático de protección:
- **🔴 Alerta roja** si tu buy-in promedio supera el **5%** de tu bankroll configurado.
- **🟡 Aviso dorado** si está entre el **2-5%** (zona moderada).
- Se oculta automáticamente si estás dentro de los parámetros saludables.

### 🎛️ Filtros Avanzados
Un sistema de categorización que detecta automáticamente el tipo de torneo leyendo el título.

#### Filtro Temporal Dinámico
- Desde siempre, Hoy, Ayer, Últimos 3/7 días, Mes en curso.
- **Rango Personalizado (Desde/Hasta):** Se actualiza en tiempo real.

#### Categorías Independientes (Toggles)
| Toggle | Qué filtra |
|---|---|
| **Clásicos** | Torneos estándar sin formato especial. |
| **Bounty/PKO** | Torneos con nocaut progresivo. |
| **Turbo** | Torneos con ciegas aceleradas. |
| **Hyper** | Torneos hiper-turbo (separado de Turbo). |
| **GG Series** | Todos los eventos oficiales GG, sin importar si son turbos o bounties. |
| **WSOP** | Eventos World Series of Poker. |
| **Flipouts** | Premios tipo ThanksGG/Freeroll. |
| **Satélites/Steps** | Torneos clasificatorios. |
| **T$ Builder** | Torneos para ganar Tournament Dollars (T$). |
| **Final Tables** | Solo torneos donde hiciste Top 9. |

> Las categorías especiales (GG Series, WSOP, etc.) tienen **prioridad absoluta** sobre sub-filtros de formato.

### 📅 Vista de Sesiones
Dropdown con múltiples modos de agrupación:

| Modo | Descripción |
|---|---|
| **Vista: Torneos** | Cada torneo individual (por defecto). |
| **Sesión: Diaria** | Agrupa por día exacto. |
| **Sesión: Semanal** | Agrupa por semana (Lun → Dom). Ej: "Sem 5 May → 11 May 2026". |
| **Sesión: Mensual** | Agrupa por mes completo. Ej: "Mayo 2026". |
| **Últimos 6 Meses** | Diario pero solo los últimos 6 meses. |
| **Últimos 12 Meses** | Diario pero solo el último año. |
| **Personalizado** | Rango de fechas libre (Desde → Hasta). |

- Un **banner dorado** indica en qué modo de sesión estás.
- Las **stats del panel superior** se recalculan para reflejar solo los datos de la sesión activa.
- Cada grupo tiene botón **"Detalle 🔽"** para expandir los torneos individuales.

### 📋 Gestión de Torneos en Tabla
- **Ordenamiento Inteligente:** Clic en cualquier cabecera (Fecha, Torneo, Buy-in, Re-entrys, Cobro, Profit, Posición) para ordenar ascendente/descendente.
- **Semáforo de Cobros:**
  - 🥇 **Amarillo/Dorado:** Cobro ≥ costo total del torneo.
  - 🔴 **Rojo:** Cobraste algo pero no cubriste el buy-in + re-entrys.
  - 🔘 **Gris:** Cobro = $0.00.
- **Edición y Fotos:** Modificá datos manualmente y adjuntá capturas de pantalla (Base64).
- **Checkboxes:** Seleccioná torneos individuales o sesiones enteras para eliminarlos.

### 🗄️ Administración
- **Almacenamiento Local:** Todo funciona en `localStorage`. Ningún dato sale de tu máquina.
- **Exportación CSV:** Exportá reportes filtrados a Excel con un clic.
- **Vaciar Base:** Botón con confirmación para reiniciar el Tracker.

---

## 🚀 Cómo Usarlo

1. **Abrí** el archivo `index.html` en tu navegador moderno (Chrome, Edge, Firefox, Brave).
2. **Configurá tu Bankroll Inicial** en el campo superior y guardalo con 💾.
3. **Hacé clic en `Subir TXT / ZIP`** y seleccioná los reportes del cajero de GGPoker.
4. **¡Listo!** El sistema procesa cientos de torneos al instante.
5. Usá los **filtros y sesiones** para analizar tu rendimiento por tipo, fecha y formato.

---

## 🛠️ Tecnologías
- **HTML5 / Vanilla CSS** — Renderizado ultrarrápido, tema oscuro premium.
- **Vanilla JavaScript (ES6+)** — Sin frameworks pesados, con lógica de parsing RegExp.
- **Chart.js** — Visualización de datos dinámica (evolución de banca + profit por tipo).
- **JSZip** — Lectura y descompresión del export de GGPoker directo en RAM del cliente.
