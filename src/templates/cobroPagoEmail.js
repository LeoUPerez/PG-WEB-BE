const cobroPagoEmailHtml = ({ nombre, numeroCobro, lineas, montoTotal, link }) => {
  const filas = (lineas || [])
    .map(
      (l) => `
      <tr>
        <td style="padding:10px 0;font-size:13px;color:#C7CEDA;border-bottom:1px solid rgba(255,255,255,0.06);">${l.concepto}</td>
        <td align="right" style="padding:10px 0;font-size:13px;color:#FFFFFF;font-weight:700;border-bottom:1px solid rgba(255,255,255,0.06);">$${Number(l.monto).toFixed(2)}</td>
      </tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Cotización de pago — U-ROD</title>
</head>
<body style="margin:0;padding:0;background-color:#0B1220;font-family:Segoe UI, Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0B1220;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background-color:#141C2E;border:1px solid rgba(242,183,5,0.25);border-radius:20px;overflow:hidden;">

          <tr>
            <td align="center" style="padding:36px 32px 24px;">
              <div style="display:inline-block;width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,#F2B705,#C99A04);line-height:52px;font-size:22px;font-weight:800;color:#0B1220;">U</div>
              <div style="margin-top:14px;font-size:13px;font-weight:700;letter-spacing:1.5px;color:#F2B705;text-transform:uppercase;">U-ROD · Sistema de Gestión</div>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:0 32px;">
              <h1 style="margin:0;font-size:20px;color:#FFFFFF;font-weight:700;">Tienes un pago pendiente</h1>
              <p style="margin:10px 0 0;font-size:13.5px;line-height:1.6;color:#8B96A8;">
                Hola${nombre ? ' ' + nombre : ''}, tienes una cotización lista para pagar con tarjeta. Cobro <strong style="color:#C7CEDA;">${numeroCobro}</strong>.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 32px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:6px 16px;">
                ${filas}
                <tr>
                  <td style="padding:14px 0 4px;font-size:13px;font-weight:700;color:#F2B705;text-transform:uppercase;letter-spacing:0.5px;">Total</td>
                  <td align="right" style="padding:14px 0 4px;font-size:18px;font-weight:800;color:#F2B705;">$${Number(montoTotal).toFixed(2)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:28px 32px 8px;">
              <a href="${link}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#F2B705,#C99A04);color:#0B1220;font-weight:700;font-size:14px;text-decoration:none;border-radius:10px;">Pagar ahora →</a>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 32px 8px;">
              <p style="margin:0;font-size:12.5px;line-height:1.7;color:#6B7A90;">
                Si no reconoces este cobro, ignora este correo.
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:28px 32px 32px;border-top:1px solid rgba(255,255,255,0.06);margin-top:20px;">
              <p style="margin:20px 0 0;font-size:11.5px;color:#4E5F78;">U-ROD &copy; 2026 · Sistema de Gestión</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};

const cobroPagoEmailText = ({ nombre, numeroCobro, lineas, montoTotal, link }) => {
  const filas = (lineas || []).map((l) => `- ${l.concepto}: $${Number(l.monto).toFixed(2)}`).join('\n');
  return (
    `Hola${nombre ? ' ' + nombre : ''},\n\n` +
    `Tienes una cotización lista para pagar con tarjeta. Cobro ${numeroCobro}.\n\n` +
    `${filas}\n\n` +
    `Total: $${Number(montoTotal).toFixed(2)}\n\n` +
    `Paga aquí: ${link}\n\n` +
    `Si no reconoces este cobro, ignora este correo.\n\n` +
    `U-ROD · Sistema de Gestión`
  );
};

module.exports = { cobroPagoEmailHtml, cobroPagoEmailText };
