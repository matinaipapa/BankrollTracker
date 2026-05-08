# Bankroll Tracker (GGPoker Edition)

Una potente aplicación web ligera diseñada específicamente para jugadores de póker en **GGPoker** que desean un control granular y avanzado de su bankroll, torneos y rentabilidad. Esta herramienta procesa los historiales exportados por el cliente oficial (archivos `.txt` y `.zip`) y renderiza estadísticas avanzadas, gráficas de evolución, y filtros ultra personalizables.

## ✨ Características Principales

### 📈 Dashboard Analítico y Estadísticas
El Tracker genera un resumen dinámico que se actualiza **en tiempo real** en base a los filtros que apliques:
- **Profit Total**: Ganancias netas tras descontar entradas y re-entrys.
- **ROI (Return on Investment)**: Tu rentabilidad en porcentaje sobre el monto total invertido.
- **ITM (In The Money)**: Porcentaje de torneos donde lograste un cobro igual o mayor a tu entrada.
- **Buy-ins Totales**: El dinero total que pusiste sobre la mesa (incluyendo re-entrys).
- **Avg Buy-in**: Media del valor de tus entradas a los torneos.
- **Mayor Ganancia**: El mejor cobro neto que has tenido en un torneo (restando el costo de la entrada).
- **Buy-in Más Alto**: El torneo más caro en el que has participado.
- **Final Tables**: Conteo automático de las veces que terminaste en el Top 9.

### 🎛️ Filtros Avanzados y de Alta Fidelidad
Un sistema de categorización que detecta automáticamente de qué tipo de torneo se trata leyendo el título. Posee **lógica combinada**: las series especiales tienen prioridad absoluta sobre la velocidad.

- **Filtro Temporal Dinámico**: 
  - Desde siempre, Hoy, Ayer, Últimos 3 días, 7 días, Mes en curso.
  - **Rango Personalizado (Desde/Hasta)**: Cambia en el instante en que modificas la fecha.
- **Categorías Aisladas**:
  - **Clásicos:** Torneos estándar, sin formato especial, bounty, ni turbos.
  - **Bounty/PKO:** Torneos con formato nocaut progresivo.
  - **Turbo:** Torneos con ciegas aceleradas.
  - **Hyper:** Torneos hiper-turbo.
  - **GG Series / WSOP:** Prioridad máxima; muestra todos los eventos oficiales de la serie, sin importar si son turbos o bounties.
  - **Satélites/Steps:** Torneos clasificatorios.
  - **Flipouts:** Premios tipo "ThanksGG" que no restan a tu balance (no se pagan).
  - **T$ Builder:** Categoría especial para los torneos creados para ganar Tournament Dollars (T$).
  - **Final Tables:** Muestra exclusivamente los torneos donde hiciste Top 9.

### 📋 Gestión de Torneos en Tabla
- **Ordenamiento Inteligente**: Haciendo clic en cualquier cabecera (Fecha, Torneo, Buy-in, Re-entrys, Cobro, Profit, Posición) se ordena de mayor a menor (o de más reciente a más viejo) instantáneamente.
- **Indicadores de Color (Semáforo de Cobros)**:
  - 🥇 **Amarillo/Dorado**: Tu cobro es mayor o igual al coste total del torneo.
  - 🔴 **Rojo**: Cobraste algo, pero no cubriste el costo del torneo (ej: un min-bounty que no cubre el buy-in).
  - 🔘 **Gris**: Cobro igual a $0.00.
- **Edición y Subida de Imágenes**: Puedes modificar manualmente los datos de un torneo si hay errores, y atar un pantallazo/imagen a un torneo específico (se codifica en Base64).
- **Modo Sesiones**: Permite agrupar todos los torneos jugados en el mismo día en una sola fila condensada para evaluar tu Profit diario de un vistazo.

### 🗄️ Administración Base de Datos
- **Almacenamiento Local**: Todo funciona enteramente en tu navegador mediante `localStorage`. Ningún dato privado se sube a internet.
- **Exportación CSV**: Exporta tus reportes filtrados a Excel con un clic.
- **Vaciar Base**: Opción directa con barrera de confirmación para reiniciar el Tracker.

## 🚀 Cómo Usarlo

1. **Abre** el archivo `index.html` en tu navegador moderno preferido (Chrome, Edge, Firefox, Brave).
2. **Haz clic en `Subir TXT / ZIP`** en la esquina superior derecha.
3. Busca los reportes generados por el cajero de GGPoker (en formato `MyTournaments.zip` o los `.txt` extraídos) y selecciónalos.
4. **¡Listo!** El sistema procesará cientos de torneos al instante y dibujará tu gráfica Bankroll y calculará tus métricas.
5. Utiliza la sección de arriba a la izquierda para ir marcando o desmarcando categorías y aislar, por ejemplo, "Cómo me fue jugando GG Series este fin de semana".

## 🛠️ Tecnologías y Mantenimiento
- HTML5 / Vanilla CSS (para renderizado súper rápido).
- **Vanilla JavaScript** (ES6+ sin frameworks pesados, con lógica de parsing RegExp).
- **Chart.js** (Para la visualización de datos dinámica).
- **JSZip** (Para leer y descomprimir el export de GGPoker directamente en la RAM del cliente).
