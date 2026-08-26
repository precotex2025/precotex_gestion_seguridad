using Microsoft.AspNetCore.Mvc;
using System;
using System.Data;
using System.Data.SqlClient;
using System.Collections.Generic;
using Microsoft.Extensions.Configuration;

namespace Precotex.SIG.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SNProveedorController : ControllerBase
    {
        private readonly string _connectionString;

        public SNProveedorController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        // GET: api/SNProveedor/getListadoProveedores?sFiltro=
        [HttpGet("getListadoProveedores")]
        public IActionResult GetListadoProveedores([FromQuery] string sFiltro = "")
        {
            try
            {
                var listado = new List<ProveedorDto>();

                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    using (SqlCommand cmd = new SqlCommand("SP_SN_PROVEEDORES_LISTAR", conn))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@sFiltro", sFiltro ?? "");

                        conn.Open();
                        using (SqlDataReader dr = cmd.ExecuteReader())
                        {
                            while (dr.Read())
                            {
                                listado.Add(new ProveedorDto
                                {
                                    id = dr["id"] != DBNull.Value ? Convert.ToInt32(dr["id"]) : 0,
                                    razon = dr["razon"]?.ToString(),
                                    ruc = dr["ruc"]?.ToString(),
                                    tipo = dr["tipo"]?.ToString(),
                                    proceso = dr["proceso"]?.ToString(),
                                    contacto = dr["contacto"]?.ToString(),
                                    homologacion = dr["homologacion"]?.ToString(),
                                    desempeno = dr["desempeno"]?.ToString(),
                                    evaluacion = dr["evaluacion"] != DBNull.Value ? Convert.ToDateTime(dr["evaluacion"]).ToString("yyyy-MM-dd") : "",
                                    reeval = dr["reeval"] != DBNull.Value ? Convert.ToDateTime(dr["reeval"]).ToString("yyyy-MM-dd") : "",
                                    sctr = dr["sctr"] != DBNull.Value ? Convert.ToDateTime(dr["sctr"]).ToString("yyyy-MM-dd") : "",
                                    induccion = dr["induccion"] != DBNull.Value ? Convert.ToDateTime(dr["induccion"]).ToString("yyyy-MM-dd") : "",
                                    iperc = dr["iperc"] != DBNull.Value ? Convert.ToDateTime(dr["iperc"]).ToString("yyyy-MM-dd") : "",
                                    seguro = dr["seguro"] != DBNull.Value ? Convert.ToDateTime(dr["seguro"]).ToString("yyyy-MM-dd") : ""
                                });
                            }
                        }
                    }
                }

                return Ok(new { success = true, data = listado });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // POST: api/SNProveedor/postProveedorMnto
        [HttpPost("postProveedorMnto")]
        public IActionResult PostProveedorMnto([FromBody] ProveedorMntoRequest model)
        {
            try
            {
                if (model == null) return BadRequest(new { success = false, message = "Datos de entrada requeridos." });

                int idGenerado = 0;
                string mensaje = "";

                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    using (SqlCommand cmd = new SqlCommand("SP_SN_PROVEEDORES_MANTO", conn))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@Accion", model.Accion ?? "I");
                        cmd.Parameters.AddWithValue("@Id", model.id);
                        cmd.Parameters.AddWithValue("@Razon", model.razon ?? "");
                        cmd.Parameters.AddWithValue("@Ruc", model.ruc ?? "");
                        cmd.Parameters.AddWithValue("@Tipo", model.tipo ?? "");
                        cmd.Parameters.AddWithValue("@Proceso", model.proceso ?? "");
                        cmd.Parameters.AddWithValue("@Contacto", model.contacto ?? "");
                        cmd.Parameters.AddWithValue("@Homologacion", model.homologacion ?? "");
                        cmd.Parameters.AddWithValue("@Desempeno", model.desempeno ?? "");
                        cmd.Parameters.AddWithValue("@Evaluacion", string.IsNullOrEmpty(model.evaluacion) ? (object)DBNull.Value : DateTime.Parse(model.evaluacion));
                        cmd.Parameters.AddWithValue("@Reeval", string.IsNullOrEmpty(model.reeval) ? (object)DBNull.Value : DateTime.Parse(model.reeval));
                        cmd.Parameters.AddWithValue("@Sctr", string.IsNullOrEmpty(model.sctr) ? (object)DBNull.Value : DateTime.Parse(model.sctr));
                        cmd.Parameters.AddWithValue("@Induccion", string.IsNullOrEmpty(model.induccion) ? (object)DBNull.Value : DateTime.Parse(model.induccion));
                        cmd.Parameters.AddWithValue("@Iperc", string.IsNullOrEmpty(model.iperc) ? (object)DBNull.Value : DateTime.Parse(model.iperc));
                        cmd.Parameters.AddWithValue("@Seguro", string.IsNullOrEmpty(model.seguro) ? (object)DBNull.Value : DateTime.Parse(model.seguro));

                        conn.Open();
                        using (SqlDataReader dr = cmd.ExecuteReader())
                        {
                            if (dr.Read())
                            {
                                idGenerado = dr["id"] != DBNull.Value ? Convert.ToInt32(dr["id"]) : 0;
                                mensaje = dr["mensaje"]?.ToString();
                            }
                        }
                    }
                }

                return Ok(new { success = true, id = idGenerado, message = mensaje });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }

    public class ProveedorDto
    {
        public int id { get; set; }
        public string razon { get; set; }
        public string ruc { get; set; }
        public string tipo { get; set; }
        public string proceso { get; set; }
        public string contacto { get; set; }
        public string homologacion { get; set; }
        public string desempeno { get; set; }
        public string evaluacion { get; set; }
        public string reeval { get; set; }
        public string sctr { get; set; }
        public string induccion { get; set; }
        public string iperc { get; set; }
        public string seguro { get; set; }
    }

    public class ProveedorMntoRequest : ProveedorDto
    {
        public string Accion { get; set; } // 'I': Insert, 'U': Update, 'D': Delete
    }
}
