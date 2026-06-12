# MAGG CRM v2 — Intelligence OS

## Objetivo

Convertir GitHub en un sistema de inteligencia de mercado y originación, no solo en una lista de deals. Cada registro debe ayudar a decidir:

- a quién llamar,
- qué precio/bid defender,
- qué fondo activar,
- qué broker merece tiempo,
- qué operación de mercado cambia nuestra tesis,
- qué deal debe morir rápido.

## Objetos del CRM

### 1. `DEAL`
Oportunidades que MAGG puede analizar, ofertar, financiar, operar o descartar.

**Regla mínima:** ningún DEAL debería estar vivo sin `owner`, `next_action`, `next_action_date`, `capital_path` y `scoring`.

### 2. `MARKET_OP`
Operaciones de mercado: noticias, rumores, procesos activos, transacciones cerradas, refinanciaciones, plataformas, expansión de operadores o señales regulatorias.

**Uso:** crear memoria propia de mercado. Aunque MAGG no participe, puede ser comparable, fuente de contactos, señal de pricing o alerta competitiva.

### 3. `FUND`
Fondos, family offices, HNWI, SOCIMIs, operadores con capital, compradores estratégicos, bancos y debt funds.

**Uso:** mapear capital y compradores. Cada ficha debe responder: `qué compra`, `con qué ticket`, `dónde`, `con quién se relaciona` y `qué deberíamos pedirle`.

### 4. `INTERMEDIARY`
Brokers, advisors, originadores, bancos de inversión, boutiques, abogados/debt advisors con acceso a operaciones.

**Uso:** puntuar calidad de dealflow y acceso real. Separar originadores útiles de ruido.

## Labels recomendadas

### Tipo de registro
- `crm:deal`
- `crm:market-op`
- `crm:fund`
- `crm:intermediary`

### Estado operativo
- `status:triage`
- `status:active`
- `status:watchlist`
- `status:paused`
- `status:closed`
- `status:killed`
- `status:lost`

### Scoring inversión
- `score:go`
- `score:borderline`
- `score:pend-om`
- `score:no-go`

### Sector
- `sector:hotel`
- `sector:serviced-apartments`
- `sector:flex-living`
- `sector:coliving`
- `sector:pbsa`
- `sector:aparthotel`
- `sector:land`
- `sector:office-conversion`
- `sector:platform`
- `sector:debt`

### Mercado
- `market:madrid`
- `market:barcelona`
- `market:malaga-costa-sol`
- `market:valencia`
- `market:sevilla`
- `market:baleares`
- `market:canarias`
- `market:portugal`
- `market:spain`

### Función MAGG
- `fit:lp`
- `fit:co-investor`
- `fit:exit-buyer`
- `fit:lender`
- `fit:jv-partner`
- `fit:competitor`
- `fit:broker-signal`
- `fit:pricing-comp`

## Campos de GitHub Project recomendados

Si se crea/actualiza un GitHub Project, usar estos campos:

- **Record Type**: DEAL / MARKET_OP / FUND / INTERMEDIARY
- **Status**: Triage / Active / Watchlist / Paused / Closed / Killed / Lost
- **Scoring**: GO / BORDERLINE / PEND_OM / NO_GO / WATCHLIST
- **Sector**
- **Market / City**
- **Owner**
- **Next Action Date**
- **Source Company**
- **Relationship Strength**: 1-5
- **Capital Path**
- **MAGG Fit**: LP / co-investor / lender / exit buyer / broker / comp / competitor
- **Last Contact**
- **Source URL**

## Rutina de uso

### Al entrar un deal
1. Crear `DEAL`.
2. Completar YAML mínimo.
3. Añadir fuente/intermediario.
4. Crear o linkar `INTERMEDIARY` si no existe.
5. Linkar `FUND` potenciales como LP/lender/buyer.
6. Linkar `MARKET_OP` comparables.
7. Cerrar con next action fechada.

### Al detectar operación en prensa
1. Crear `MARKET_OP`.
2. Capturar buyer/seller/operator/broker/lender si consta.
3. Añadir precio, llaves/unidades, yield/cap rate si consta.
4. Linkar fondos/intermediarios existentes o crear nuevos.
5. Escribir lectura MAGG: pricing, contacto, riesgo competitivo u oportunidad futura.

### Al mapear fondos
1. Crear `FUND`.
2. Registrar estrategia, ticket, sectores, geografías y deals conocidos.
3. Marcar fit: LP, co-investor, lender, exit buyer o competitor.
4. Añadir próximo touchpoint.

### Al mapear intermediarios
1. Crear `INTERMEDIARY`.
2. Puntuar acceso real y calidad de pricing.
3. Linkar deals enviados y operaciones conocidas.
4. Definir cadencia y ask concreto.

## Screening de prensa/webs relevantes

Fuentes prioritarias para poblar `MARKET_OP`, `FUND` e `INTERMEDIARY`:

- Brainsre News
- EjePrime
- Alimarket Hoteles
- Hosteltur
- TecnoHotel
- Expansión / Cinco Días / El Economista
- Idealista News
- Observatorio Inmobiliario
- Iberian Property
- React News / Green Street si hay acceso
- Savills, CBRE, JLL, Colliers, Cushman, Christie & Co, BNP RE, Knight Frank reports
- BME Growth / CNMV para SOCIMIs y hechos relevantes
- Comunicados de fondos, operadores y brokers

### Queries recurrentes

- `hotel inversión España compra venta fondo`
- `portfolio hotelero España comprador vendedor`
- `apartamentos turísticos operador expansión España`
- `serviced apartments Spain investment`
- `flex living Madrid inversión`
- `hotel Madrid venta proceso broker`
- `SOCIMI hotel venta activo`
- `debt fund real estate Spain hotel`
- `sale and leaseback hotel Spain`
- `operador hotelero expansión apartamentos turísticos España`

## Regla de calidad

No inventar datos. Si no consta, usar `n/d`. La ficha es útil aunque falten números si captura:

- quién está activo,
- con quién,
- en qué tipo de producto,
- por qué importa para MAGG,
- y cuál es el próximo movimiento.
