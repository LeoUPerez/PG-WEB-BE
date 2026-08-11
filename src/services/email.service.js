const sgMail = require('@sendgrid/mail');
const { passwordResetEmailHtml, passwordResetEmailText } = require('../templates/passwordResetEmail');

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const enviarCodigoRecuperacion = async ({ destinatario, nombre, usuario, token, ttlMinutos }) => {
  if (!process.env.SENDGRID_API_KEY) {
    throw new Error('SENDGRID_API_KEY no está configurada');
  }
  if (!process.env.SENDGRID_FROM_EMAIL) {
    throw new Error('SENDGRID_FROM_EMAIL no está configurada');
  }

  await sgMail.send({
    to: destinatario,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: 'Tu código de recuperación — U-ROD',
    text: passwordResetEmailText({ nombre, usuario, token, ttlMinutos }),
    html: passwordResetEmailHtml({ nombre, usuario, token, ttlMinutos }),
  });
};

module.exports = { enviarCodigoRecuperacion };
