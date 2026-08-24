// =========================================================================================
// PRECOTEX SOMA - BACKEND C# (.NET WEB API)
// CONTROLADOR PARA EL ENVÍO AUTOMÁTICO DE CREDENCIALES POR CORREO ELECTRÓNICO (PUE-02)
// Copiar este código en tu proyecto Web API en Visual Studio
// =========================================================================================

using System;
using System.Net;
using System.Net.Mail;
using Microsoft.AspNetCore.Mvc;

namespace Precotex.GestionSeguridad.Controllers
{
    // 1. MODELO DTO (Recibe los datos enviados desde Angular)
    public class EmailCredencialesDto
    {
        public string Destinatario { get; set; }
        public string Nombre { get; set; }
        public string Usuario { get; set; }
        public string Puesto { get; set; }
        public string ClaveTemporal { get; set; }
        public string Asunto { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")] // Ruta: api/TxLogin
    public class TxLoginController : ControllerBase
    {
        // 2. ENDPOINT: POST api/TxLogin/postEnviarCredencialesCorreo
        [HttpPost("postEnviarCredencialesCorreo")]
        public IActionResult PostEnviarCredencialesCorreo([FromBody] EmailCredencialesDto request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Destinatario))
            {
                return BadRequest(new { success = false, message = "El correo del destinatario es obligatorio." });
            }

            try
            {
                // Configuración del correo emisor corporativo
                string correoEmisor = "fhuamani@precotexperu.com";
                string nombreEmisor = "Sistemas Precotex S.A.C.";
                
                // NOTA: Reemplazar con la contraseña o App Password del correo institucional
                string passwordEmisor = "TU_CONTRASEÑA_O_APP_KEY"; 

                // Servidor SMTP (Office 365 / Exchange de Precotex)
                string smtpHost = "smtp.office365.com"; // O el servidor SMTP interno de Precotex
                int smtpPort = 587; // Puerto TLS estándar

                using (var mail = new MailMessage())
                {
                    mail.From = new MailAddress(correoEmisor, nombreEmisor);
                    mail.To.Add(request.Destinatario.Trim());
                    mail.CC.Add(correoEmisor); // Envía una copia a fhuamani@precotexperu.com para control
                    mail.Subject = string.IsNullOrWhiteSpace(request.Asunto) 
                        ? "🔐 Credenciales de Acceso - Portal de Seguridad Precotex" 
                        : request.Asunto;
                    mail.IsBodyHtml = true;

                    // Plantilla HTML visual profesional para el correo
                    mail.Body = $@"
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset='utf-8'>
                    </head>
                    <body style='font-family: Arial, sans-serif; background-color: #f1f5f9; padding: 20px; margin: 0;'>
                        <div style='max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;'>
                            
                            <!-- Header Precotex -->
                            <div style='background-color: #1e1b4b; padding: 28px 24px; text-align: center; color: #ffffff;'>
                                <h1 style='margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;'>PRECOTEX S.A.C.</h1>
                                <p style='margin: 6px 0 0 0; font-size: 13px; color: #a5b4fc;'>Sistema Integrado de Gestión - Seguridad y Salud (SOMA)</p>
                            </div>

                            <!-- Cuerpo del mensaje -->
                            <div style='padding: 30px 24px; color: #334155; line-height: 1.6;'>
                                <h2 style='font-size: 18px; color: #0f172a; margin-top: 0;'>¡Bienvenido(a), {request.Nombre}!</h2>
                                <p style='font-size: 14px;'>Se ha generado tu cuenta de usuario para acceder al <b>Portal Corporativo de Gestión Documentaria y Seguridad</b>.</p>
                                
                                <!-- Cuadro de Credenciales -->
                                <div style='background-color: #f8fafc; border: 1px solid #cbd5e1; border-left: 5px solid #6366f1; border-radius: 8px; padding: 18px; margin: 24px 0;'>
                                    <table style='width: 100%; font-size: 14px; border-collapse: collapse;'>
                                        <tr>
                                            <td style='padding: 6px 0; color: #64748b; width: 140px;'>🏢 <b>Puesto / Cargo:</b></td>
                                            <td style='padding: 6px 0; font-weight: 700; color: #1e293b;'>{request.Puesto}</td>
                                        </tr>
                                        <tr>
                                            <td style='padding: 6px 0; color: #64748b;'>👤 <b>Usuario de Acceso:</b></td>
                                            <td style='padding: 6px 0;'><code style='background: #e0e7ff; color: #3730a3; padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 14px;'>{request.Usuario}</code></td>
                                        </tr>
                                        <tr>
                                            <td style='padding: 6px 0; color: #64748b;'>🔑 <b>Contraseña Temporal:</b></td>
                                            <td style='padding: 6px 0;'><code style='background: #fef3c7; color: #92400e; padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 14px;'>{request.ClaveTemporal}</code></td>
                                        </tr>
                                    </table>
                                </div>

                                <p style='font-size: 13px; color: #475569;'>
                                    💡 <b>Recomendación de Seguridad:</b> Por políticas de seguridad de la empresa, te sugerimos cambiar tu contraseña luego de ingresar por primera vez.
                                </p>
                            </div>

                            <!-- Footer -->
                            <div style='background-color: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;'>
                                <p style='margin: 0;'>Atentamente, <b>Área de Sistemas - Precotex S.A.C.</b></p>
                                <p style='margin: 4px 0 0 0;'>Contacto de soporte: <a href='mailto:fhuamani@precotexperu.com' style='color: #6366f1; text-decoration: none;'>fhuamani@precotexperu.com</a></p>
                            </div>

                        </div>
                    </body>
                    </html>";

                    using (var smtp = new SmtpClient(smtpHost, smtpPort))
                    {
                        smtp.Credentials = new NetworkCredential(correoEmisor, passwordEmisor);
                        smtp.EnableSsl = true;
                        smtp.Send(mail);
                    }
                }

                return Ok(new { 
                    success = true, 
                    message = $"Credenciales enviadas correctamente a {request.Destinatario} con copia a {correoEmisor}." 
                });
            }
            catch (Exception ex)
            {
                // Retornar mensaje detallado si hubo error de autenticación SMTP
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error al enviar correo SMTP: " + ex.Message 
                });
            }
        }
    }
}
