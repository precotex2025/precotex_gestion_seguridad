using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace Precotex.GestionSeguridad.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SNReqLegalController : ControllerBase
    {
        private readonly string _connectionString;

        public SNReqLegalController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection") 
                ?? "Server=localhost;Database=BD_PRECOTEX;Trusted_Connection=True;TrustServerCertificate=True;";
        }

        /// <summary>
        /// Obtiene el listado de requisitos legales y normativos con filtro opcional.
        /// GET: api/SNReqLegal/getListadoReqLegal?sFiltro=SST
        /// </summary>
        [HttpGet("getListadoReqLegal")]
        public IActionResult GetListadoReqLegal([FromQuery] string sFiltro = "")
        {
            var listado = new List<ReqLegalResponse>();

            try
            {
                using (var cn = new SqlConnection(_connectionString))
                {
                    using (var cmd = new SqlCommand("dbo.SP_SN_REQ_LEGAL_LISTAR", cn))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@sFiltro", (object)sFiltro ?? DBNull.Value);

                        cn.Open();
                        using (var dr = cmd.ExecuteReader())
                        {
                            while (dr.Read())
                            {
                                listado.Add(new ReqLegalResponse
                                {
                                    Id = dr["id"] != DBNull.Value ? Convert.ToInt32(dr["id"]) : 0,
                                    Item = dr["item"].ToString(),
                                    Requisito = dr["requisito"].ToString(),
                                    Tema = dr["tema"].ToString(),
                                    Ambito = dr["ambito"].ToString(),
                                    Tipo = dr["tipo"].ToString(),
                                    Norma = dr["norma"].ToString(),
                                    Articulo = dr["articulo"].ToString(),
                                    Entidad = dr["entidad"].ToString(),
                                    Obligacion = dr["obligacion"].ToString(),
                                    Evidenciadoc = dr["evidenciadoc"].ToString(),
                                    Estado = dr["estado"].ToString(),
                                    Responsable = dr["responsable"].ToString(),
                                    Frecuencia = dr["frecuencia"].ToString(),
                                    Evaluacion = dr["evaluacion"].ToString(),
                                    Proxeval = dr["proxeval"].ToString(),
                                    Vencimiento = dr["vencimiento"].ToString(),
                                    Observaciones = dr["observaciones"].ToString(),
                                    Evidencia = dr["evidencia"].ToString(),
                                    FlgEstado = dr["flg_estado"].ToString()
                                });
                            }
                        }
                    }
                }

                return Ok(new { success = true, elements = listado, message = "Listado de requisitos legales obtenido exitosamente." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error al consultar listado legal: " + ex.Message });
            }
        }

        /// <summary>
        /// Mantenimiento de Requisitos Legales (Insertar, Editar o Eliminar)
        /// POST: api/SNReqLegal/postReqLegalMnto
        /// </summary>
        [HttpPost("postReqLegalMnto")]
        public IActionResult PostReqLegalMnto([FromBody] ReqLegalMntoRequest request)
        {
            if (request == null)
            {
                return BadRequest(new { success = false, message = "Los datos de la solicitud no son válidos." });
            }

            try
            {
                using (var cn = new SqlConnection(_connectionString))
                {
                    using (var cmd = new SqlCommand("dbo.SP_SN_REQ_LEGAL_MNTO", cn))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;

                        cmd.Parameters.AddWithValue("@cAccion", request.Accion ?? (request.Id > 0 ? "U" : "I"));
                        cmd.Parameters.AddWithValue("@nid_req_legal", request.Id);
                        cmd.Parameters.AddWithValue("@citem", (object)request.Item ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@vrequisito", (object)request.Requisito ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@vtema", (object)request.Tema ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@vambito", (object)request.Ambito ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@vtipo", (object)request.Tipo ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@vnorma", (object)request.Norma ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@varticulo", (object)request.Articulo ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@ventidad", (object)request.Entidad ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@vextracto_obligacion", (object)request.Obligacion ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@vevidencia_cumplimiento", (object)request.Evidenciadoc ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@vestado", (object)request.Estado ?? "En proceso");
                        cmd.Parameters.AddWithValue("@vresponsable", (object)request.Responsable ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@vfrecuencia", (object)request.Frecuencia ?? DBNull.Value);

                        // Manejo seguro de fechas NULL
                        cmd.Parameters.AddWithValue("@devaluacion", string.IsNullOrWhiteSpace(request.Evaluacion) ? DBNull.Value : (object)DateTime.Parse(request.Evaluacion));
                        cmd.Parameters.AddWithValue("@dproxeval", string.IsNullOrWhiteSpace(request.Proxeval) ? DBNull.Value : (object)DateTime.Parse(request.Proxeval));
                        cmd.Parameters.AddWithValue("@dvencimiento", string.IsNullOrWhiteSpace(request.Vencimiento) ? DBNull.Value : (object)DateTime.Parse(request.Vencimiento));

                        cmd.Parameters.AddWithValue("@vobservaciones", (object)request.Observaciones ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@vevidencia_archivo", (object)request.Evidencia ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@cusu_usuario", (object)request.Usuario ?? "SISTEMAS");

                        cn.Open();
                        using (var dr = cmd.ExecuteReader())
                        {
                            if (dr.Read())
                            {
                                bool exito = Convert.ToInt32(dr["bExito"]) == 1;
                                string mensaje = dr["vMensaje"].ToString();
                                int idGenerado = dr["id"] != DBNull.Value ? Convert.ToInt32(dr["id"]) : request.Id;

                                return Ok(new { success = exito, message = mensaje, id = idGenerado });
                            }
                        }
                    }
                }

                return Ok(new { success = true, message = "Operación completada exitosamente." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error al procesar mantenimiento legal: " + ex.Message });
            }
        }
    }

    public class ReqLegalMntoRequest
    {
        public string Accion { get; set; } // 'I', 'U', 'D'
        public int Id { get; set; }
        public string Item { get; set; }
        public string Requisito { get; set; }
        public string Tema { get; set; }
        public string Ambito { get; set; }
        public string Tipo { get; set; }
        public string Norma { get; set; }
        public string Articulo { get; set; }
        public string Entidad { get; set; }
        public string Obligacion { get; set; }
        public string Evidenciadoc { get; set; }
        public string Estado { get; set; }
        public string Responsable { get; set; }
        public string Frecuencia { get; set; }
        public string Evaluacion { get; set; }
        public string Proxeval { get; set; }
        public string Vencimiento { get; set; }
        public string Observaciones { get; set; }
        public string Evidencia { get; set; }
        public string Usuario { get; set; }
    }

    public class ReqLegalResponse
    {
        public int Id { get; set; }
        public string Item { get; set; }
        public string Requisito { get; set; }
        public string Tema { get; set; }
        public string Ambito { get; set; }
        public string Tipo { get; set; }
        public string Norma { get; set; }
        public string Articulo { get; set; }
        public string Entidad { get; set; }
        public string Obligacion { get; set; }
        public string Evidenciadoc { get; set; }
        public string Estado { get; set; }
        public string Responsable { get; set; }
        public string Frecuencia { get; set; }
        public string Evaluacion { get; set; }
        public string Proxeval { get; set; }
        public string Vencimiento { get; set; }
        public string Observaciones { get; set; }
        public string Evidencia { get; set; }
        public string FlgEstado { get; set; }
    }
}
