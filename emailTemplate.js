// emailTemplate.js
export function buildEmailHTML({
  alumno,
  entradas,
  eventoNombre = 'Baile Escolar 2025'
}) {
  return `
  <!doctype html>
  <html lang="es">
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <title>Entradas ${eventoNombre}</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f7fb;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background:#ffffff;border:1px solid #eee;border-radius:12px;overflow:hidden">
            <tr>
              <td style="background:#111827;color:#fff;padding:20px 24px;">
                <h1 style="margin:0;font-size:20px;">${eventoNombre}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <p style="margin:0 0 12px 0;">Hola,</p>
                <p style="margin:0 0 12px 0;">
                  Te enviamos el código QR para el acceso al evento de <b>${alumno}</b>.
                </p>
                <p style="margin:0 0 12px 0;">
                  Este QR permite <b>${entradas}</b> ${
    entradas === 1 ? 'acceso' : 'accesos'
  }.
                  Si no entráis todos juntos, en el control de acceso podrán registrar entradas parciales.
                </p>
                <div style="margin:20px 0;padding:16px;border:1px dashed #e5e7eb;border-radius:10px;background:#fafafa;">
                  <p style="margin:0 0 8px 0;font-weight:600;">Tu QR va adjunto a este correo (archivo PNG).</p>
                  <p style="margin:0;">Muestra el QR en el móvil o impreso al llegar.</p>
                </div>
                <p style="margin:0;color:#6b7280;font-size:12px;">
                  Si tienes dudas, responde a este email.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;background:#f9fafb;color:#6b7280;font-size:12px;">
                © ${new Date().getFullYear()} ${eventoNombre} — Acceso con QR
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`
}
