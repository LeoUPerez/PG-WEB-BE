/** Simulación de tarjeta: nunca persistir PAN/CVV. Misma regla en checkout y cobros. */
const evaluarTarjetaSimulada = (numeroTarjeta) => {
  const digits = String(numeroTarjeta || '').replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) {
    return { aprobada: false, mensaje: 'Número de tarjeta inválido.' };
  }

  let brand = 'Card';
  if (/^4/.test(digits)) brand = 'Visa';
  else if (/^(5[1-5]|2[2-7])/.test(digits)) brand = 'Mastercard';
  else if (/^3[47]/.test(digits)) brand = 'Amex';

  const last4 = digits.slice(-4);

  if (digits === '4000000000000002') {
    return {
      aprobada: false,
      brand,
      last4,
      mensaje: 'Pago rechazado por el banco.',
    };
  }

  if (digits === '4242424242424242' || digits.startsWith('4242')) {
    return { aprobada: true, brand, last4 };
  }

  if (digits === '5555555555554444' || digits === '378282246310005') {
    return { aprobada: true, brand, last4 };
  }

  return {
    aprobada: false,
    brand,
    last4,
    mensaje: 'No pudimos procesar el pago con esta tarjeta.',
  };
};

module.exports = { evaluarTarjetaSimulada };
