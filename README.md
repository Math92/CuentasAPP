# CuentasAPP - Gestor de Finanzas Personales 💰

## Descripción
CuentasAPP es una aplicación web para la gestión de finanzas personales que permite llevar un control detallado de deudas, créditos y gastos fijos. Desarrollada con JavaScript vanilla, HTML5 y CSS3, ofrece una interfaz intuitiva para el manejo de presupuestos personales.

## Características Principales 🌟

- **Vista General Mensual**
  - Resumen de pagos a recibir y realizar
  - Balance mensual estimado
  - Visualización de gastos fijos pendientes
  - Vista organizada por mes

- **Gestión de Deudores**
  - Registro de personas que deben dinero
  - Control de pagos mensuales
  - Seguimiento de saldos pendientes
  - Historial de pagos realizados

- **Control de Acreedores**
  - Registro de deudas propias
  - Seguimiento de pagos mensuales
  - Control de saldos pendientes
  - Historial de pagos efectuados

- **Administración de Gastos Fijos**
  - Registro de gastos recurrentes
  - Control de fechas de pago
  - Historial de pagos por mes
  - Actualización de montos

## Tecnologías Utilizadas 🛠️

- HTML5
- CSS3 (con variables CSS para theming)
- JavaScript (ES6+)
- LocalStorage para persistencia de datos
- Diseño Responsivo
- Sistema de Grid y Flexbox

## Estructura del Proyecto 📁

```
CuentasAPP/
├── index.html          # Estructura principal de la aplicación
├── styles.css         # Estilos y diseño visual
└── app.js            # Lógica de la aplicación
```

### Componentes Principales del Código

#### JavaScript (app.js)
- Clases principales:
  - `DebtRecord`: Manejo de registros de deuda/crédito
  - `FixedExpense`: Gestión de gastos fijos
- Sistema de estado centralizado
- Funciones de persistencia con LocalStorage
- Manejo de UI y eventos

#### HTML (index.html)
- Estructura modular por secciones
- Sistema de pestañas para navegación
- Formularios para ingreso de datos
- Contenedores para visualización de información

#### CSS (styles.css)
- Sistema de variables para temas
- Diseño responsivo
- Estilos de tarjetas y formularios
- Animaciones y transiciones

## Características Técnicas 🔧

### Persistencia de Datos
- Utiliza LocalStorage para guardar:
  - Registros de deudores
  - Registros de acreedores
  - Gastos fijos
  - Estado actual de la aplicación

### Funcionalidades Principales
- Cálculo automático de balances
- Sistema de recordatorios por fecha
- Actualización en tiempo real
- Validación de formularios


## Guía de Uso 📖

1. **Vista General**
   - Selecciona el mes para ver el resumen
   - Revisa los pagos pendientes y realizados
   - Consulta el balance mensual

2. **Gestión de Deudores/Acreedores**
   - Agrega nuevos registros con el formulario
   - Registra pagos en las tarjetas individuales
   - Consulta historiales de pago

3. **Gastos Fijos**
   - Registra gastos recurrentes
   - Marca pagos realizados
   - Actualiza montos cuando sea necesario

