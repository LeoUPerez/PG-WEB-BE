const reservaConfirmEmailHtml = ({ nombre, clase, dia, rango, fecha, entrenador, salon, link }) => `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Confirma tu reserva — U-ROD</title>
</head>
<body style="margin:0;padding:0;background-color:#0B1220;font-family:Segoe UI, Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0B1220;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background-color:#141C2E;border:1px solid rgba(242,183,5,0.25);border-radius:20px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding:36px 32px 24px;">
              <div style="display:inline-block;width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,#F2B705,#C99A04);line-height:52px;font-size:22px;font-weight:800;color:#0B1220;">U</div>
              <div style="margin-top:14px;font-size:13px;font-weight:700;letter-spacing:1.5px;color:#F2B705;text-transform:uppercase;">U-ROD · Sistema de Gestión</div>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td align="center" style="padding:0 32px;">
              <h1 style="margin:0;font-size:20px;color:#FFFFFF;font-weight:700;">Tu reserva está registrada</h1>
              <p style="margin:10px 0 0;font-size:13.5px;line-height:1.6;color:#8B96A8;">
                Hola${nombre ? ' ' + nombre : ''}, confirma o cancela tu asistencia a la clase con el botón de abajo.
              </p>
            </td>
          </tr>

          <!-- Details box -->
          <tr>
            <td style="padding:28px 32px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:14px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:#8B96A8;text-transform:uppercase;">Clase</div>
                    <div style="font-size:15px;font-weight:700;color:#FFFFFF;margin-top:2px;">${clase}</div>
                  </td>
                </tr>
                <tr><td style="border-top:1px solid rgba(255,255,255,0.06);"></td></tr>
                <tr>
                  <td style="padding:18px 20px;">
                    <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:#8B96A8;text-transform:uppercase;">Día y horario</div>
                    <div style="font-size:14px;color:#C7CEDA;margin-top:2px;">${dia} · ${rango}</div>
                  </td>
                </tr>
                <tr><td style="border-top:1px solid rgba(255,255,255,0.06);"></td></tr>
                <tr>
                  <td style="padding:18px 20px;">
                    <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:#8B96A8;text-transform:uppercase;">Fecha</div>
                    <div style="font-size:14px;color:#C7CEDA;margin-top:2px;">${fecha}</div>
                  </td>
                </tr>
                <tr><td style="border-top:1px solid rgba(255,255,255,0.06);"></td></tr>
                <tr>
                  <td style="padding:18px 20px;">
                    <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:#8B96A8;text-transform:uppercase;">Entrenador · Salón</div>
                    <div style="font-size:14px;color:#C7CEDA;margin-top:2px;">${entrenador} · ${salon}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Button -->
          <tr>
            <td align="center" style="padding:28px 32px 8px;">
              <a href="${link}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#F2B705,#C99A04);color:#0B1220;font-weight:700;font-size:14px;text-decoration:none;border-radius:10px;">Confirmar o cancelar mi asistencia →</a>
            </td>
          </tr>

          <!-- Note -->
          <tr>
            <td style="padding:20px 32px 8px;">
              <p style="margin:0;font-size:12.5px;line-height:1.7;color:#6B7A90;">
                Si no reconoces esta reserva, ignora este correo.
              </p>
            </td>
          </tr>

          <!-- Footer -->
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

const reservaConfirmEmailText = ({ nombre, clase, dia, rango, fecha, entrenador, salon, link }) =>
  `Hola${nombre ? ' ' + nombre : ''},\n\n` +
  `Tu reserva quedó registrada:\n` +
  `Clase: ${clase}\n` +
  `Día y horario: ${dia} · ${rango}\n` +
  `Fecha: ${fecha}\n` +
  `Entrenador · Salón: ${entrenador} · ${salon}\n\n` +
  `Confirma o cancela tu asistencia aquí: ${link}\n\n` +
  `Si no reconoces esta reserva, ignora este correo.\n\n` +
  `U-ROD · Sistema de Gestión`;

module.exports = { reservaConfirmEmailHtml, reservaConfirmEmailText };
