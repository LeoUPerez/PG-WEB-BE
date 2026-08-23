const ventaConfirmEmailHtml = ({
  nombre,
  numero_venta,
  total,
  tipo_entrega,
  estado,
  link,
}) => `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tu pedido ${numero_venta} — U-ROD</title>
</head>
<body style="margin:0;padding:0;background-color:#0B1220;font-family:Segoe UI, Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0B1220;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background-color:#141C2E;border:1px solid rgba(242,183,5,0.25);border-radius:20px;overflow:hidden;">
          <tr>
            <td align="center" style="padding:36px 32px 24px;">
              <div style="display:inline-block;width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,#F2B705,#C99A04);line-height:52px;font-size:22px;font-weight:800;color:#0B1220;">U</div>
              <div style="margin-top:14px;font-size:13px;font-weight:700;letter-spacing:1.5px;color:#F2B705;text-transform:uppercase;">U-ROD · Pedidos</div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 32px;">
              <h1 style="margin:0;font-size:20px;color:#FFFFFF;font-weight:700;">Pedido registrado</h1>
              <p style="margin:10px 0 0;font-size:13.5px;line-height:1.6;color:#8B96A8;">
                Hola${nombre ? ' ' + nombre : ''}, guardamos tu pedido. Usa el número de tracking para seguirlo.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:14px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:#8B96A8;text-transform:uppercase;">N° de tracking</div>
                    <div style="font-size:18px;font-weight:800;color:#F2B705;margin-top:4px;letter-spacing:0.04em;">${numero_venta}</div>
                  </td>
                </tr>
                <tr><td style="border-top:1px solid rgba(255,255,255,0.06);"></td></tr>
                <tr>
                  <td style="padding:18px 20px;">
                    <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:#8B96A8;text-transform:uppercase;">Total</div>
                    <div style="font-size:15px;font-weight:700;color:#FFFFFF;margin-top:2px;">$${Number(total || 0).toFixed(2)}</div>
                  </td>
                </tr>
                <tr><td style="border-top:1px solid rgba(255,255,255,0.06);"></td></tr>
                <tr>
                  <td style="padding:18px 20px;">
                    <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:#8B96A8;text-transform:uppercase;">Entrega · Pago</div>
                    <div style="font-size:14px;color:#C7CEDA;margin-top:2px;">${tipo_entrega} · ${estado}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:28px 32px 40px;">
              <a href="${link}" style="display:inline-block;padding:14px 28px;border-radius:12px;background:linear-gradient(135deg,#F2B705,#C99A04);color:#0B1220;font-size:14px;font-weight:800;text-decoration:none;">Seguir mi pedido</a>
              <p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:#8B96A8;">Si el botón no funciona, copia este enlace:<br><span style="color:#C7CEDA;word-break:break-all;">${link}</span></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const ventaConfirmEmailText = ({
  nombre,
  numero_venta,
  total,
  tipo_entrega,
  estado,
  link,
}) =>
  `Hola${nombre ? ' ' + nombre : ''},\n\n` +
  `Tu pedido ${numero_venta} fue registrado.\n` +
  `Total: $${Number(total || 0).toFixed(2)}\n` +
  `Entrega: ${tipo_entrega}\n` +
  `Estado de pago: ${estado}\n\n` +
  `Sigue tu pedido aquí:\n${link}\n`;

module.exports = { ventaConfirmEmailHtml, ventaConfirmEmailText };
