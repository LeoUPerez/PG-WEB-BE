const passwordResetEmailHtml = ({ nombre, usuario, token, ttlMinutos }) => `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Recuperar contraseña — U-ROD</title>
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
              <h1 style="margin:0;font-size:20px;color:#FFFFFF;font-weight:700;">Recupera tu contraseña</h1>
              <p style="margin:10px 0 0;font-size:13.5px;line-height:1.6;color:#8B96A8;">
                Hola${nombre ? ' ' + nombre : ''}, recibimos una solicitud para restablecer la contraseña
                de la cuenta <strong style="color:#C7CEDA;">${usuario}</strong>. Usa el siguiente código para continuar.
              </p>
            </td>
          </tr>

          <!-- Code box -->
          <tr>
            <td align="center" style="padding:28px 32px 8px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background-color:rgba(242,183,5,0.08);border:1px solid rgba(242,183,5,0.35);border-radius:14px;">
                <tr>
                  <td align="center" style="padding:22px 16px;">
                    <div style="font-size:11px;font-weight:700;letter-spacing:1.2px;color:#8B96A8;text-transform:uppercase;margin-bottom:8px;">Tu código de recuperación</div>
                    <div style="font-size:34px;font-weight:800;letter-spacing:8px;color:#F2B705;font-family:'Courier New',monospace;">${token}</div>
                    <div style="font-size:12px;color:#8B96A8;margin-top:10px;">Vence en ${ttlMinutos} minutos</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Note -->
          <tr>
            <td style="padding:24px 32px 8px;">
              <p style="margin:0;font-size:12.5px;line-height:1.7;color:#6B7A90;">
                Si tú no solicitaste este cambio, ignora este correo — tu contraseña actual seguirá funcionando con normalidad.
                Nunca compartas este código con nadie.
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

const passwordResetEmailText = ({ nombre, usuario, token, ttlMinutos }) =>
  `Hola${nombre ? ' ' + nombre : ''},\n\n` +
  `Recibimos una solicitud para restablecer la contraseña de la cuenta "${usuario}".\n\n` +
  `Tu código de recuperación es: ${token}\n` +
  `Vence en ${ttlMinutos} minutos.\n\n` +
  `Si tú no solicitaste este cambio, ignora este correo.\n\n` +
  `U-ROD · Sistema de Gestión`;

module.exports = { passwordResetEmailHtml, passwordResetEmailText };
