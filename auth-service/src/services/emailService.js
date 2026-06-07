const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter;

const getTransporter = () => {
  if (!env.emailFrom || !env.emailPassword) {
    throw new Error('Email delivery is not configured');
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.emailHost,
      port: env.emailPort,
      secure: env.emailSecure,
      auth: {
        user: env.emailFrom,
        pass: env.emailPassword,
      },
    });
  }
  return transporter;
};

const verifyEmailTransport = async () => getTransporter().verify();

const escapeHtml = (value) => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const sendActionEmail = async ({ to, subject, heading, message, actionLabel, actionUrl }) => {
  const safeUrl = escapeHtml(actionUrl);
  await getTransporter().sendMail({
    from: `"CCInterview" <${env.emailFrom}>`,
    to,
    subject,
    text: `${heading}\n\n${message}\n\n${actionLabel}: ${actionUrl}\n\nSi no solicitaste esta acción, ignora este correo.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#172033">
        <h1 style="font-size:24px">CCInterview</h1>
        <h2 style="font-size:20px">${escapeHtml(heading)}</h2>
        <p style="line-height:1.6">${escapeHtml(message)}</p>
        <p style="margin:28px 0">
          <a href="${safeUrl}" style="background:#4f46e5;color:#fff;text-decoration:none;padding:12px 18px;border-radius:6px;font-weight:700">
            ${escapeHtml(actionLabel)}
          </a>
        </p>
        <p style="font-size:13px;color:#64748b">Si no solicitaste esta acción, ignora este correo.</p>
      </div>
    `,
  });
};

const sendVerificationEmail = ({ user, token }) => sendActionEmail({
  to: user.email,
  subject: 'Verifica tu correo en CCInterview',
  heading: `Hola${user.firstName ? `, ${user.firstName}` : ''}`,
  message: 'Confirma tu correo electrónico para activar tu cuenta y comenzar tus entrevistas.',
  actionLabel: 'Verificar correo',
  actionUrl: `${env.frontendUrl.replace(/\/+$/, '')}/verify-email?token=${encodeURIComponent(token)}`,
});

const sendPasswordResetEmail = ({ user, token }) => sendActionEmail({
  to: user.email,
  subject: 'Recupera tu contraseña de CCInterview',
  heading: 'Restablece tu contraseña',
  message: 'Recibimos una solicitud para crear una nueva contraseña. Este enlace es temporal y solo puede utilizarse una vez.',
  actionLabel: 'Crear nueva contraseña',
  actionUrl: `${env.frontendUrl.replace(/\/+$/, '')}/reset-password?token=${encodeURIComponent(token)}`,
});

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  verifyEmailTransport,
};
