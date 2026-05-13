import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify?token=${token}`;
  await transporter.sendMail({
    from: `"Time Tracker" <${process.env.SMTP_FROM || 'noreply@timetracker.com'}>`,
    to: email,
    subject: 'Verifica tu email',
    html: `<p>Hacé clic para verificar tu email: <a href="${verifyUrl}">${verifyUrl}</a></p>`,
  });
}

export async function sendTicketNotification(email: string, subject: string, message: string) {
  await transporter.sendMail({
    from: `"Time Tracker" <${process.env.SMTP_FROM || 'noreply@timetracker.com'}>`,
    to: email,
    subject: `Ticket: ${subject}`,
    html: `<p>${message}</p>`,
  });
}
