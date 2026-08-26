using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Web.Http;

namespace Precotex.GestionSeguridad.Controllers
{
    [RoutePrefix("api/SNReqLegal")]
    public class SNReqLegalController : ApiController
    {
        private readonly string _connectionString;

        public SNReqLegalController()
        {
            _connectionString = ConfigurationManager.ConnectionStrings["DefaultConnection"] != null 
                ? ConfigurationManager.ConnectionStrings["DefaultConnection"].ConnectionString 
                : "Server=localhost;Database=BD_PRECOTEX;Trusted_Connection=True;";
        }

        /// <summary>
        /// Obtiene el listado de requisitos legales y normativos (.NET Framework 4.8 / Web API 2)
        /// GET: api/SNReqLegal/getListadoReqLegal?sFiltro=SST
        /// </summary>
        [HttpGet]
        [Route("getListadoReqLegal")]
        public IHttpActionResult GetListadoReqLegal(string sFiltro = "")
        {
            var listado = new List<ReqLegalResponseDto>();

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
                                listado.Add(new ReqLegalResponseDto
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

                return Ok(new { success = true, elements = listado, message = "Listado legal obtenido exitosamente." });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        /// <summary>
        /// Mantenimiento de Requisitos Legales (.NET Framework 4.8 / Web API 2)
        /// POST: api/SNReqLegal/postReqLegalMnto
        /// </summary>
        [HttpPost]
        [Route("postReqLegalMnto")]
        public IHttpActionResult PostReqLegalMnto([FromBody] ReqLegalMntoDto request)
        {
            if (request == null)
            {
                return BadRequest("Datos de solicitud inválidos.");
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

                        cmd.Parameters.AddWithValue("@devaluacion", string.IsNullOrEmpty(request.Evaluacion) ? DBNull.Value : (object)DateTime.Parse(request.Evaluacion));
                        cmd.Parameters.AddWithValue("@dproxeval", string.IsNullOrEmpty(request.Proxeval) ? DBNull.Value : (object)DateTime.Parse(request.Proxeval));
                        cmd.Parameters.AddWithValue("@dvencimiento", string.IsNullOrEmpty(request.Vencimiento) ? DBNull.Value : (object)DateTime.Parse(request.Vencimiento));

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

                return Ok(new { success = true, message = "Mantenimiento completado exitosamente." });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
    }

    public class ReqLegalMntoDto
    {
        public string Accion { get; set; }
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

    public class ReqLegalResponseDto
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
