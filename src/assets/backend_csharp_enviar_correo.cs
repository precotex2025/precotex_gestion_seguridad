// =========================================================================================
// PRECOTEX SOMA - BACKEND C# (.NET WEB API)
// CONTROLADOR DEDICADO DEL PROYECTO: SNUsuarioController
// Ubicación: Controllers/SecureNorm/SNUsuarioController.cs
// Ruta: api/SNUsuario
// =========================================================================================

using System;
using System.Data;
using System.Data.SqlClient;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace ic.backend.precotex.web.Api.Controllers.SecureNorm
{
    public class EmailCredencialesDto
    {
        public string? Destinatario { get; set; }
        public string? Nombre { get; set; }
        public string? Usuario { get; set; }
        public string? Puesto { get; set; }
        public string? ClaveTemporal { get; set; }
        public string? Asunto { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")] // Ruta: api/SNUsuario
    public class SNUsuarioCorreoController : ControllerBase
    {
        private readonly string _connectionString;

        public SNUsuarioCorreoController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("TextilConnectionSomma") 
                ?? configuration.GetConnectionString("DefaultConnection")
                ?? configuration.GetConnectionString("TextilConnection");
        }

        // =========================================================================================
        // ENDPOINT: POST api/SNUsuario/postEnviarCredencialesCorreo
        // Ejecuta [dbo].[Sp_Envia_Correo_Alerta_RegistroUsuario]
        // Utiliza Database Mail SQL Server (Perfil 'ALERTAS' / msdb.dbo.sp_send_dbmail)
        // =========================================================================================
        [HttpPost("postEnviarCredencialesCorreo")]
        public async Task<IActionResult> PostEnviarCredencialesCorreo([FromBody] EmailCredencialesDto request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Destinatario))
            {
                return BadRequest(new { success = false, message = "El correo del destinatario es obligatorio." });
            }

            try
            {
                using (var conn = new SqlConnection(_connectionString))
                {
                    await conn.OpenAsync();

                    using (var cmd = new SqlCommand("dbo.Sp_Envia_Correo_Alerta_RegistroUsuario", conn))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.CommandTimeout = 60;

                        // Descubre dinámicamente los parámetros del SP en SQL Server
                        try
                        {
                            SqlCommandBuilder.DeriveParameters(cmd);
                        }
                        catch { }

                        if (cmd.Parameters.Count > 1)
                        {
                            foreach (SqlParameter p in cmd.Parameters)
                            {
                                if (p.Direction == ParameterDirection.ReturnValue) continue;

                                string pName = p.ParameterName.ToLower();

                                if (pName.Contains("email") || pName.Contains("correo") || pName.Contains("destinatario"))
                                    p.Value = (object)request.Destinatario?.Trim() ?? DBNull.Value;
                                else if (pName.Contains("nom"))
                                    p.Value = (object)request.Nombre?.Trim() ?? DBNull.Value;
                                else if (pName.Contains("usu") || pName.Contains("user"))
                                    p.Value = (object)request.Usuario?.Trim() ?? DBNull.Value;
                                else if (pName.Contains("contra") || pName.Contains("pass") || pName.Contains("clave"))
                                    p.Value = (object)request.ClaveTemporal?.Trim() ?? DBNull.Value;
                                else
                                    p.Value = DBNull.Value;
                            }
                        }
                        else
                        {
                            cmd.Parameters.Clear();
                            cmd.Parameters.Add(new SqlParameter("@Email", SqlDbType.VarChar, 200) { Value = (object)request.Destinatario?.Trim() ?? DBNull.Value });
                            cmd.Parameters.Add(new SqlParameter("@Usuario", SqlDbType.VarChar, 100) { Value = (object)request.Usuario?.Trim() ?? DBNull.Value });
                            cmd.Parameters.Add(new SqlParameter("@Contraseña", SqlDbType.VarChar, 50) { Value = (object)request.ClaveTemporal?.Trim() ?? DBNull.Value });
                            cmd.Parameters.Add(new SqlParameter("@Nombre", SqlDbType.VarChar, 150) { Value = (object)request.Nombre?.Trim() ?? DBNull.Value });
                        }

                        await cmd.ExecuteNonQueryAsync();
                    }
                }

                return Ok(new { success = true, message = "Procedimiento Sp_Envia_Correo_Alerta_RegistroUsuario ejecutado exitosamente para " + request.Destinatario });
            }
            catch (Exception ex)
            {
                return Ok(new { success = false, message = "Aviso al ejecutar Sp_Envia_Correo_Alerta_RegistroUsuario: " + ex.Message });
            }
        }
    }
}
