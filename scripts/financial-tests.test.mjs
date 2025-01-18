import { Loan, DebtRecord, FixedExpense } from './base.js';
import { faker } from '@faker-js/faker';

// Funciones helper para generar datos
const generarDatosPrestamo = () => ({
  monto: parseFloat(faker.finance.amount(1000, 10000, 2)),
  descripcion: faker.finance.transactionDescription(),
  cuotas: faker.datatype.number({ min: 6, max: 24 }),
  fecha: faker.date.past().toISOString().split('T')[0]
});

const generarDatosGastoFijo = () => ({
  nombre: faker.commerce.productName(),
  monto: parseFloat(faker.finance.amount(100, 2000, 2)),
  diaVencimiento: faker.datatype.number({ min: 1, max: 28 }),
  detalles: faker.lorem.sentence()
});

describe('Pruebas Avanzadas de la Clase Préstamo', () => {
  let prestamo;
  let datosPrestamo;

  beforeEach(() => {
    datosPrestamo = generarDatosPrestamo();
    prestamo = new Loan(
      datosPrestamo.monto,
      datosPrestamo.fecha,
      datosPrestamo.descripcion,
      datosPrestamo.cuotas
    );
  });

  describe('Validación y Procesamiento de Pagos', () => {
    test('debe manejar correctamente pagos con decimales', () => {
      const montoCuota = parseFloat((datosPrestamo.monto / datosPrestamo.cuotas).toFixed(2));
      const fechaPago = faker.date.recent().toISOString().split('T')[0];
      const pago = prestamo.addPayment(montoCuota, fechaPago);
      
      expect(pago.amount).toBe(montoCuota);
      expect(prestamo.remainingAmount).toBe(parseFloat((datosPrestamo.monto - montoCuota).toFixed(2)));
    });

    test('debe rechazar fechas de pago futuras', () => {
      const fechaFutura = faker.date.future().toISOString().split('T')[0];
      const montoPago = parseFloat(faker.finance.amount(100, 500, 2));
      
      expect(() => {
        prestamo.addPayment(montoPago, fechaFutura);
      }).toThrow();
    });

    test('debe calcular correctamente las cuotas restantes', () => {
      const montoCuota = parseFloat(prestamo.monthlyAmount);
      const fechaBase = new Date(datosPrestamo.fecha);
      
      // Realizar pagos aleatorios
      const pagosTotales = faker.datatype.number({ min: 1, max: 3 });
      
      for(let i = 0; i < pagosTotales; i++) {
        const fechaPago = new Date(fechaBase);
        fechaPago.setMonth(fechaBase.getMonth() + i);
        prestamo.addPayment(montoCuota, fechaPago.toISOString().split('T')[0]);
      }
      
      const fechaVerificacion = new Date(fechaBase);
      fechaVerificacion.setMonth(fechaBase.getMonth() + pagosTotales);
      const cuotasEsperadas = datosPrestamo.cuotas - pagosTotales;
      
      expect(prestamo.getRemainingInstallments(fechaVerificacion)).toBe(cuotasEsperadas);
    });
  });

  describe('Seguimiento de Pagos Mensuales', () => {
    test('debe rastrear pagos dentro de meses específicos', () => {
      const fechaBase = new Date(datosPrestamo.fecha);
      const montoCuota = parseFloat(prestamo.monthlyAmount);
      const mesesPago = 3;
      
      // Generar pagos para diferentes meses
      for(let i = 0; i < mesesPago; i++) {
        const fechaPago = new Date(fechaBase);
        fechaPago.setMonth(fechaBase.getMonth() + i);
        prestamo.addPayment(montoCuota, fechaPago.toISOString().split('T')[0]);
      }

      // Verificar pagos del mes actual
      const mesActual = fechaBase.toISOString().slice(0, 7);
      const pagosMes = prestamo.getPaymentsInMonth(mesActual);
      
      expect(pagosMes.length).toBe(1);
      expect(pagosMes[0].amount).toBe(montoCuota);
    });
  });
});

describe('Pruebas Avanzadas del Registro de Deudas', () => {
  let registroDeuda;

  beforeEach(() => {
    registroDeuda = new DebtRecord(
      faker.name.fullName(),
      faker.lorem.sentence()
    );
  });

  describe('Gestión de Múltiples Préstamos', () => {
    test('debe manejar correctamente múltiples préstamos activos', () => {
      const prestamos = Array.from({ length: 3 }, () => {
        const datos = generarDatosPrestamo();
        return registroDeuda.addLoan(
          datos.monto,
          datos.fecha,
          datos.descripcion,
          datos.cuotas
        );
      });
      
      const totalEsperado = prestamos.reduce((sum, loan) => sum + loan.amount, 0);
      // Usando tolerancia para comparación de números decimales
      expect(Math.abs(registroDeuda.totalOwed - parseFloat(totalEsperado.toFixed(2)))).toBeLessThan(0.01);
      expect(registroDeuda.getActiveLoans().length).toBe(prestamos.length);
    });

    test('debe actualizar el total adeudado cuando los préstamos son pagados parcialmente', () => {
      const datos1 = generarDatosPrestamo();
      const datos2 = generarDatosPrestamo();
      
      const prestamo1 = registroDeuda.addLoan(
        datos1.monto,
        datos1.fecha,
        datos1.descripcion,
        datos1.cuotas
      );
      
      const prestamo2 = registroDeuda.addLoan(
        datos2.monto,
        datos2.fecha,
        datos2.descripcion,
        datos2.cuotas
      );
      
      const montoCuota1 = parseFloat(prestamo1.monthlyAmount);
      const montoCuota2 = parseFloat(prestamo2.monthlyAmount);
      
      registroDeuda.addPaymentToLoan(prestamo1.id, montoCuota1, faker.date.recent().toISOString().split('T')[0]);
      registroDeuda.addPaymentToLoan(prestamo2.id, montoCuota2, faker.date.recent().toISOString().split('T')[0]);
      
      const totalEsperado = parseFloat((datos1.monto + datos2.monto - montoCuota1 - montoCuota2).toFixed(2));
      // Usando tolerancia para comparación de números decimales
      expect(Math.abs(registroDeuda.totalOwed - totalEsperado)).toBeLessThan(0.01);
    });
  });
});

describe('Pruebas Avanzadas de Gastos Fijos', () => {
  let gastoFijo;
  let datosGasto;

  beforeEach(() => {
    datosGasto = generarDatosGastoFijo();
    gastoFijo = new FixedExpense(
      datosGasto.nombre,
      datosGasto.monto,
      datosGasto.diaVencimiento,
      datosGasto.detalles
    );
  });

  describe('Seguimiento del Historial de Pagos', () => {
    test('debe rastrear el historial de pagos con montos reales', () => {
      const fechaPago = faker.date.recent().toISOString().split('T')[0];
      const mesActual = fechaPago.slice(0, 7);
      const montoReal = parseFloat(faker.finance.amount(
        datosGasto.monto * 0.9,
        datosGasto.monto * 1.1,
        2
      ));
      
      gastoFijo.registerPayment(mesActual, fechaPago, montoReal);
      
      const pago = gastoFijo.getMonthPayment(mesActual);
      expect(pago.amount).toBe(montoReal);
      expect(pago.paid).toBe(true);
    });

    test('debe manejar múltiples actualizaciones de monto', () => {
      const nuevosMontos = Array.from({ length: 3 }, () =>
        parseFloat(faker.finance.amount(500, 2000, 2))
      );
      
      nuevosMontos.forEach(monto => {
        gastoFijo.updateAmount(monto);
      });
      
      expect(gastoFijo.amount).toBe(nuevosMontos[nuevosMontos.length - 1]);
      expect(gastoFijo.history.length).toBe(nuevosMontos.length);
      expect(gastoFijo.history[0].previousAmount).toBe(datosGasto.monto);
    });
  });
});

describe('Pruebas de Integración', () => {
  test('debe manejar el ciclo de vida completo del préstamo con gastos fijos', () => {
    const datosPrestamo = generarDatosPrestamo();
    const datosGasto = generarDatosGastoFijo();
    
    const registroDeuda = new DebtRecord(faker.name.fullName());
    const gastoFijo = new FixedExpense(
      datosGasto.nombre,
      datosGasto.monto,
      datosGasto.diaVencimiento,
      datosGasto.detalles
    );

    const fechaInicial = new Date(datosPrestamo.fecha);
    const mesActual = fechaInicial.toISOString().slice(0, 7);

    // Agregar préstamo y realizar pagos
    const prestamo = registroDeuda.addLoan(
      datosPrestamo.monto,
      datosPrestamo.fecha,
      datosPrestamo.descripcion,
      datosPrestamo.cuotas
    );
    
    const montoCuota = parseFloat(prestamo.monthlyAmount);

    // Registrar pago de gasto fijo y préstamo
    gastoFijo.registerPayment(mesActual, fechaInicial.toISOString().split('T')[0]);
    
    const fechaPago = new Date(fechaInicial);
    fechaPago.setMonth(fechaInicial.getMonth() + 1);
    registroDeuda.addPaymentToLoan(prestamo.id, montoCuota, fechaPago.toISOString().split('T')[0]);

    // Verificar estado
    expect(Math.abs(registroDeuda.totalOwed - parseFloat((datosPrestamo.monto - montoCuota).toFixed(2)))).toBeLessThan(0.01);
    expect(gastoFijo.isMonthPaid(mesActual)).toBe(true);
    expect(prestamo.getRemainingInstallments(fechaPago)).toBe(datosPrestamo.cuotas - 1);
  });
});