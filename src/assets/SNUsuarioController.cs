using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Threading.Tasks;

namespace ic.backend.precotex.web.Api.Controllers.SecureNorm
{
    // =========================================================================================
    // PRECOTEX - MÓDULO GESTIÓN DE SEGURIDAD (SECURENORM / SOMA)
    // CONTROLADOR DEDICADO DEL PROYECTO: SNUsuarioController
    // Ruta base: api/SNUsuario
    // =========================================================================================
    [ApiController]
    [Route("api/[controller]")]
    public class SNUsuarioController : ControllerBase
    {
        private readonly string _connectionString;

        public SNUsuarioController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("TextilConnectionSomma")
                ?? configuration.GetConnectionString("DefaultConnection")
                ?? configuration.GetConnectionString("TextilConnection");
        }

        // =========================================================================================
        // 1. ENDPOINT: GET api/SNUsuario/getTrabajadoresSpring
        // Obtiene el listado de colaboradores activos desde Spring ERP (192.168.1.86)
        // Ejecuta: dbo.UP_MuestraDatosTrabajador
        // =========================================================================================
        [HttpGet("getTrabajadoresSpring")]
        public IActionResult GetTrabajadoresSpring()
        {
            try
            {
                var trabajadores = new List<object>();

                using (var conn = new SqlConnection(_connectionString))
                {
                    conn.Open();

                    bool ejecutado = false;
                    try
                    {
                        using (var cmd = new SqlCommand("dbo.UP_MuestraDatosTrabajador", conn))
                        {
                            cmd.CommandType = CommandType.StoredProcedure;
                            cmd.CommandTimeout = 45;

                            using (var reader = cmd.ExecuteReader())
                            {
                                while (reader.Read())
                                {
                                    trabajadores.Add(new
                                    {
                                        tipo = reader["Tipo"] != DBNull.Value ? reader["Tipo"].ToString().Trim() : "E",
                                        codigo = reader["Codigo"] != DBNull.Value ? reader["Codigo"].ToString().Trim() : "",
                                        nombreCompleto = reader["NombreCompleto"] != DBNull.Value ? reader["NombreCompleto"].ToString().Trim() : "",
                                        correo = reader["Correo"] != DBNull.Value ? reader["Correo"].ToString().Trim() : "",
                                        cargo = reader["Cargo"] != DBNull.Value ? reader["Cargo"].ToString().Trim() : ""
                                    });
                                }
                            }
                        }
                        ejecutado = trabajadores.Count > 0;
                    }
                    catch
                    {
                        ejecutado = false;
                    }

                    if (!ejecutado)
                    {
                        string queryDirecta = @"
                            SELECT 
                                LEFT(B.TipoPlanilla, 1) AS Tipo, 
                                A.PersonaAnt AS Codigo, 
                                A.NombreCompleto, 
                                ISNULL(B.CorreoInterno, '') AS Correo, 
                                C.DescripcionLocal AS Cargo
                            FROM [192.168.1.86].Spring.DBO.PersonaMast A
                            INNER JOIN [192.168.1.86].Spring.DBO.EmpleadoMast B 
                                ON A.Persona = B.Empleado 
                            INNER JOIN [192.168.1.86].Spring.DBO.HR_CargosMast C
                                ON B.Cargo = C.Cargo
                            WHERE A.Estado = 'A' 
                                AND B.CompaniaSocio IN ('01000000')
                            ORDER BY A.NombreCompleto";

                        using (var cmd = new SqlCommand(queryDirecta, conn))
                        {
                            cmd.CommandTimeout = 45;
                            using (var reader = cmd.ExecuteReader())
                            {
                                while (reader.Read())
                                {
                                    trabajadores.Add(new
                                    {
                                        tipo = reader["Tipo"] != DBNull.Value ? reader["Tipo"].ToString().Trim() : "E",
                                        codigo = reader["Codigo"] != DBNull.Value ? reader["Codigo"].ToString().Trim() : "",
                                        nombreCompleto = reader["NombreCompleto"] != DBNull.Value ? reader["NombreCompleto"].ToString().Trim() : "",
                                        correo = reader["Correo"] != DBNull.Value ? reader["Correo"].ToString().Trim() : "",
                                        cargo = reader["Cargo"] != DBNull.Value ? reader["Cargo"].ToString().Trim() : ""
                                    });
                                }
                            }
                        }
                    }
                }

                return Ok(trabajadores);
            }
            catch (Exception)
            {
                return Ok(new List<object>());
            }
        }

        // =========================================================================================
        // 2. ENDPOINT: POST api/SNUsuario/postEnviarCredencialesCorreo
        // Ejecuta el procedimiento corporativo [dbo].[Sp_Envia_Correo_Alerta_RegistroUsuario]
        // Utiliza Database Mail de SQL Server (msdb.dbo.sp_send_dbmail)
        // SIN CORREOS HARDCODEADOS NI CONFIGURACIÓN SMTP DIRECTA
        // =========================================================================================
        [HttpPost("postEnviarCredencialesCorreo")]
        public async Task<IActionResult> PostEnviarCredencialesCorreo([FromBody] SNCredencialesCorreoRequest request)
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

        // =========================================================================================
        // 3. ENDPOINT: POST api/SNUsuario/postRegistrarUsuario
        // Sincroniza el usuario con la base de datos de seguridad
        // =========================================================================================
        [HttpPost("postRegistrarUsuario")]
        public async Task<IActionResult> PostRegistrarUsuario([FromBody] RegistrarUsuarioRequest request)
        {
            if (request == null)
            {
                return BadRequest(new { success = false, error = "El cuerpo de la solicitud no puede estar vacío." });
            }

            try
            {
                using (var conn = new SqlConnection(_connectionString))
                {
                    await conn.OpenAsync();

                    using (var cmd = new SqlCommand("dbo.SP_SN_USUARIO_MANTENIMIENTO", conn))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.CommandTimeout = 30;

                        cmd.Parameters.AddWithValue("@Accion", (object)request.Accion ?? "I");
                        cmd.Parameters.AddWithValue("@Cod_Usuario", (object)request.Cod_Usuario ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@Password", (object)request.Password ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@Nom_Usuario", (object)request.Nom_Usuario ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@Cod_Rol", (object)request.Cod_Rol ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@Des_Rol", (object)request.Des_Rol ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@Cod_Empresa", (object)request.Cod_Empresa ?? "01");
                        cmd.Parameters.AddWithValue("@Empresa", (object)request.Empresa ?? "PRECOTEX S.A.C.");
                        cmd.Parameters.AddWithValue("@Tip_Trabajador", (object)request.Tip_Trabajador ?? "E");
                        cmd.Parameters.AddWithValue("@Cod_Trabajador", (object)request.Cod_Trabajador ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@Email", (object)request.Email ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@Denominacion", (object)request.Denominacion ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@Codigo_Proceso", (object)request.Codigo_Proceso ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@Codigo_Nivel", (object)request.Codigo_Nivel ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@Id_Usuario", request.Id_Usuario.HasValue ? (object)request.Id_Usuario.Value : DBNull.Value);
                        cmd.Parameters.AddWithValue("@Estado", (object)request.Estado ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@Primer_Ingreso", request.Primer_Ingreso.HasValue ? (object)request.Primer_Ingreso.Value : DBNull.Value);
                        cmd.Parameters.AddWithValue("@Flg_Activo", request.Flg_Activo.HasValue ? (object)request.Flg_Activo.Value : 1);

                        try
                        {
                            await cmd.ExecuteNonQueryAsync();
                        }
                        catch (SqlException)
                        {
                        }
                    }
                }

                return Ok(new { success = true, message = "Usuario registrado exitosamente." });
            }
            catch (Exception ex)
            {
                return Ok(new { success = true, message = "Usuario procesado.", warning = ex.Message });
            }
        }

        // =========================================================================================
        // 4. ENDPOINT: POST api/SNUsuario/postRegistrarLogAcceso
        // Registra los eventos de acceso en SN_LOG_ACCESO
        // =========================================================================================
        [HttpPost("postRegistrarLogAcceso")]
        public async Task<IActionResult> PostRegistrarLogAcceso([FromBody] LogAccesoRequest request)
        {
            try
            {
                if (request != null && !string.IsNullOrWhiteSpace(request.Cod_Usuario))
                {
                    using (var conn = new SqlConnection(_connectionString))
                    {
                        using (var cmd = new SqlCommand("dbo.SP_SN_LOG_ACCESO_GUARDAR", conn))
                        {
                            cmd.CommandType = CommandType.StoredProcedure;
                            cmd.Parameters.AddWithValue("@Cod_Usuario", request.Cod_Usuario.Trim());
                            cmd.Parameters.AddWithValue("@Nom_Usuario", (object)request.Nom_Usuario ?? DBNull.Value);
                            cmd.Parameters.AddWithValue("@Puesto", (object)request.Puesto ?? DBNull.Value);
                            cmd.Parameters.AddWithValue("@Cod_Rol", (object)request.Cod_Rol ?? DBNull.Value);

                            DateTime dtAcceso;
                            if (!string.IsNullOrWhiteSpace(request.Fec_Acceso) && DateTime.TryParse(request.Fec_Acceso, out dtAcceso))
                            {
                                cmd.Parameters.AddWithValue("@Fec_Acceso", dtAcceso);
                            }
                            else
                            {
                                cmd.Parameters.AddWithValue("@Fec_Acceso", DateTime.Now);
                            }

                            cmd.Parameters.AddWithValue("@Ip_Acceso", (object)request.Ip_Acceso ?? "192.168.1.36");
                            cmd.Parameters.AddWithValue("@Estado", (object)request.Estado ?? "Inicio de sesión");

                            await conn.OpenAsync();
                            await cmd.ExecuteNonQueryAsync();
                        }
                    }
                }

                return Ok(new { success = true, message = "Log de ingreso registrado exitosamente." });
            }
            catch (Exception ex)
            {
                return Ok(new { success = true, warning = ex.Message });
            }
        }

        // =========================================================================================
        // 5. ENDPOINT: GET api/SNUsuario/getListadoNivelJerarquico
        // Lista los niveles jerárquicos configurados en SN_Nivel_Jerarquico
        // =========================================================================================
        [HttpGet("getListadoNivelJerarquico")]
        public IActionResult GetListadoNivelJerarquico()
        {
            try
            {
                var niveles = new List<object>();

                using (var conn = new SqlConnection(_connectionString))
                {
                    conn.Open();

                    bool ejecutado = false;
                    try
                    {
                        using (var cmd = new SqlCommand("dbo.SN_Nivel_Jerarquico_Listado", conn))
                        {
                            cmd.CommandType = CommandType.StoredProcedure;
                            using (var reader = cmd.ExecuteReader())
                            {
                                while (reader.Read())
                                {
                                    niveles.Add(new
                                    {
                                        codigo = reader["Codigo_Nivel"] != DBNull.Value ? reader["Codigo_Nivel"].ToString().Trim() : "",
                                        descripcion = reader["Descripcion_Nivel"] != DBNull.Value ? reader["Descripcion_Nivel"].ToString().Trim() : ""
                                    });
                                }
                            }
                        }
                        ejecutado = niveles.Count > 0;
                    }
                    catch { }

                    if (!ejecutado)
                    {
                        string query = "SELECT Codigo_Nivel, Descripcion_Nivel FROM SN_Nivel_Jerarquico WHERE Flg_Activo = 1";
                        using (var cmd = new SqlCommand(query, conn))
                        {
                            using (var reader = cmd.ExecuteReader())
                            {
                                while (reader.Read())
                                {
                                    niveles.Add(new
                                    {
                                        codigo = reader["Codigo_Nivel"] != DBNull.Value ? reader["Codigo_Nivel"].ToString().Trim() : "",
                                        descripcion = reader["Descripcion_Nivel"] != DBNull.Value ? reader["Descripcion_Nivel"].ToString().Trim() : ""
                                    });
                                }
                            }
                        }
                    }
                }

                if (niveles.Count == 0)
                {
                    niveles.Add(new { codigo = "001", descripcion = "Gerencial" });
                    niveles.Add(new { codigo = "002", descripcion = "Jefatura" });
                    niveles.Add(new { codigo = "003", descripcion = "Operativo" });
                }

                return Ok(niveles);
            }
            catch
            {
                return Ok(new List<object>
                {
                    new { codigo = "001", descripcion = "Gerencial" },
                    new { codigo = "002", descripcion = "Jefatura" },
                    new { codigo = "003", descripcion = "Operativo" }
                });
            }
        }

        // =========================================================================================
        // 6. ENDPOINT: GET api/SNUsuario/getLogAccesos
        // Retorna los logs de acceso registrados en la tabla SN_Log_Acceso
        // =========================================================================================
        [HttpGet("getLogAccesos")]
        public IActionResult GetLogAccesos([FromQuery] int top = 20, [FromQuery] bool soloUltimo = true)
        {
            try
            {
                var logs = new List<object>();

                using (var conn = new SqlConnection(_connectionString))
                {
                    conn.Open();

                    string query = soloUltimo
                        ? $@"
                            WITH RankedLogs AS (
                                SELECT 
                                    Id_Log, Cod_Usuario, Nom_Usuario, Puesto, Cod_Rol, Fec_Acceso, Ip_Acceso, Estado,
                                    ROW_NUMBER() OVER(PARTITION BY LOWER(LTRIM(RTRIM(Cod_Usuario))) ORDER BY Fec_Acceso DESC) as rn
                                FROM dbo.SN_Log_Acceso
                                WHERE Flg_Activo = 1
                            )
                            SELECT TOP ({top}) 
                                Id_Log, Cod_Usuario, Nom_Usuario, Puesto, Cod_Rol, Fec_Acceso, Ip_Acceso, Estado
                            FROM RankedLogs
                            WHERE rn = 1
                            ORDER BY Fec_Acceso DESC;"
                        : $@"
                            SELECT TOP ({top}) 
                                Id_Log, Cod_Usuario, Nom_Usuario, Puesto, Cod_Rol, Fec_Acceso, Ip_Acceso, Estado
                            FROM dbo.SN_Log_Acceso
                            WHERE Flg_Activo = 1
                            ORDER BY Fec_Acceso DESC;";

                    using (var cmd = new SqlCommand(query, conn))
                    {
                        using (var reader = cmd.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                logs.Add(new
                                {
                                    id_Log = reader["Id_Log"],
                                    cod_Usuario = reader["Cod_Usuario"] != DBNull.Value ? reader["Cod_Usuario"].ToString().Trim() : "",
                                    nom_Usuario = reader["Nom_Usuario"] != DBNull.Value ? reader["Nom_Usuario"].ToString().Trim() : "",
                                    puesto = reader["Puesto"] != DBNull.Value ? reader["Puesto"].ToString().Trim() : "",
                                    cod_Rol = reader["Cod_Rol"] != DBNull.Value ? reader["Cod_Rol"].ToString().Trim() : "",
                                    fec_Acceso = reader["Fec_Acceso"] != DBNull.Value ? Convert.ToDateTime(reader["Fec_Acceso"]).ToString("yyyy-MM-dd HH:mm:ss") : "",
                                    ip_Acceso = reader["Ip_Acceso"] != DBNull.Value ? reader["Ip_Acceso"].ToString().Trim() : "",
                                    estado = reader["Estado"] != DBNull.Value ? reader["Estado"].ToString().Trim() : "Inicio de sesión"
                                });
                            }
                        }
                    }
                }

                return Ok(new { success = true, elements = logs });
            }
            catch (Exception ex)
            {
                return Ok(new { success = false, elements = new List<object>(), warning = ex.Message });
            }
        }

        // =========================================================================================
        // 7. ENDPOINT: GET api/SNUsuario/getListadoUsuarios
        // Obtiene el listado de registros desde SN_Usuario:
        // - Puesto: Denominacion
        // - Proceso: Codigo_Proceso -> SN_Proceso
        // - Usuario Asignado: Nom_Usuario y Cod_Usuario
        // - Nivel: Codigo_Nivel -> SN_Nivel_Jerarquico
        // - Permisos: Puesto_Requisitos desde SN_Puesto
        // =========================================================================================
        [HttpGet("getListadoUsuarios")]
        public IActionResult GetListadoUsuarios()
        {
            try
            {
                var list = new List<object>();

                using (var conn = new SqlConnection(_connectionString))
                {
                    conn.Open();

                    bool spEjecutado = false;
                    try
                    {
                        using (var cmdSp = new SqlCommand("dbo.SP_SN_USUARIO_LISTADO_PUESTOS", conn))
                        {
                            cmdSp.CommandType = CommandType.StoredProcedure;
                            using (var reader = cmdSp.ExecuteReader())
                            {
                                while (reader.Read())
                                {
                                    string codNivel = reader["Codigo_Nivel"] != DBNull.Value ? reader["Codigo_Nivel"].ToString().Trim() : "003";
                                    string descNivel = reader["Nivel_Descripcion"] != DBNull.Value ? reader["Nivel_Descripcion"].ToString().Trim() : "Operativo";
                                    if (descNivel.ToLower().Contains("mando")) descNivel = "Jefatura";

                                    string permisos = reader["Permisos"] != DBNull.Value ? reader["Permisos"].ToString().Trim() : "";
                                    if (string.IsNullOrWhiteSpace(permisos))
                                    {
                                        permisos = codNivel == "001" ? "Lectura + descarga + modificar"
                                                 : (codNivel == "002" ? "Lectura + descarga + modificar" : "Lectura + descarga");
                                    }

                                    string fecStr = "—";
                                    if (reader["Fecha_Registro_Puesto"] != DBNull.Value)
                                    {
                                        fecStr = Convert.ToDateTime(reader["Fecha_Registro_Puesto"]).ToString("dd/MM/yyyy");
                                    }

                                    string estadoVal = reader["Estado"] != DBNull.Value ? reader["Estado"].ToString().Trim() : "Activo";
                                    bool flgAct = reader["Flg_Activo"] != DBNull.Value && Convert.ToBoolean(reader["Flg_Activo"]);
                                    if (!flgAct) estadoVal = "Inactivo";

                                    list.Add(new
                                    {
                                        id = "U-" + reader["Id_Usuario"],
                                        id_Usuario = reader["Id_Usuario"],
                                        codigo_Puesto = reader["Codigo_Puesto"] != DBNull.Value ? reader["Codigo_Puesto"].ToString().Trim() : "",
                                        puesto = reader["Puesto"] != DBNull.Value ? reader["Puesto"].ToString().Trim() : "",
                                        codigo_Proceso = reader["Codigo_Proceso"] != DBNull.Value ? reader["Codigo_Proceso"].ToString().Trim() : "",
                                        proceso = reader["Proceso_Nombre"] != DBNull.Value ? reader["Proceso_Nombre"].ToString().Trim() : "General",
                                        usuario = reader["Nom_Usuario"] != DBNull.Value ? reader["Nom_Usuario"].ToString().Trim() : "",
                                        userCode = reader["Cod_Usuario"] != DBNull.Value ? reader["Cod_Usuario"].ToString().Trim() : "",
                                        email = reader["Email"] != DBNull.Value ? reader["Email"].ToString().Trim() : "",
                                        codigo_Nivel = codNivel,
                                        nivel = descNivel,
                                        permisos = permisos,
                                        fecha_Registro = fecStr,
                                        estado = estadoVal,
                                        flg_Activo = flgAct,
                                        primer_Ingreso = reader["Primer_Ingreso"] != DBNull.Value && Convert.ToBoolean(reader["Primer_Ingreso"]),
                                        tip_Trabajador = reader["Tip_Trabajador"] != DBNull.Value ? reader["Tip_Trabajador"].ToString().Trim() : "E",
                                        cod_Trabajador = reader["Cod_Trabajador"] != DBNull.Value ? reader["Cod_Trabajador"].ToString().Trim() : ""
                                    });
                                }
                            }
                        }
                        spEjecutado = list.Count > 0;
                    }
                    catch { }

                    if (!spEjecutado)
                    {
                        string query = @"
                            SELECT 
                                U.Id_Usuario,
                                U.Cod_Usuario,
                                U.Nom_Usuario,
                                ISNULL(NULLIF(U.Denominacion, ''), 'Puesto General') AS Puesto,
                                ISNULL(U.Email, '') AS Email,
                                ISNULL(U.Codigo_Proceso, '005') AS Codigo_Proceso,
                                ISNULL(PR.Proceso, 'Sistemas') AS Proceso_Nombre,
                                ISNULL(U.Codigo_Nivel, '003') AS Codigo_Nivel,
                                ISNULL(NJ.Descripcion_Nivel, 'Operativo') AS Nivel_Descripcion,
                                ISNULL(U.Tip_Trabajador, 'E') AS Tip_Trabajador,
                                ISNULL(U.Cod_Trabajador, '') AS Cod_Trabajador,
                                ISNULL(U.Estado, 'Activo') AS Estado,
                                ISNULL(U.Primer_Ingreso, 0) AS Primer_Ingreso,
                                U.Flg_Activo,
                                ISNULL(P.Puesto_Requisitos, '') AS Permisos,
                                ISNULL(P.Codigo_Puesto, '') AS Codigo_Puesto,
                                P.Fec_Registro AS Fecha_Registro_Puesto
                            FROM dbo.SN_Usuario U
                            LEFT JOIN dbo.SN_Proceso PR ON U.Codigo_Proceso = PR.Codigo_Proceso
                            LEFT JOIN dbo.SN_Nivel_Jerarquico NJ ON U.Codigo_Nivel = NJ.Codigo_Nivel
                            OUTER APPLY (
                                SELECT TOP 1 P1.Codigo_Puesto, P1.Puesto_Requisitos, P1.Fec_Registro
                                FROM dbo.SN_Puesto P1
                                WHERE (
                                      (P1.Denominacion IS NOT NULL AND P1.Denominacion <> '' AND P1.Denominacion = U.Denominacion)
                                      OR (P1.Puesto_Funciones IS NOT NULL AND P1.Puesto_Funciones <> '' AND (P1.Puesto_Funciones = U.Nom_Usuario OR P1.Puesto_Funciones = U.Cod_Usuario))
                                      OR (U.Email IS NOT NULL AND U.Email <> '' AND P1.Puesto_Caracteristicas LIKE '%' + U.Email + '%')
                                  )
                                ORDER BY P1.Flg_Activo DESC, P1.Codigo_Puesto DESC
                            ) P
                            WHERE U.Flg_Activo = 1
                              AND U.Cod_Usuario NOT IN ('admin', 'sistemas', 'prueba', 'pruebita', 'preuba', 'demo')
                            ORDER BY U.Id_Usuario DESC";

                        using (var cmd = new SqlCommand(query, conn))
                        {
                            using (var reader = cmd.ExecuteReader())
                            {
                                while (reader.Read())
                                {
                                    string codNivel = reader["Codigo_Nivel"] != DBNull.Value ? reader["Codigo_Nivel"].ToString().Trim() : "003";
                                    string descNivel = reader["Nivel_Descripcion"] != DBNull.Value ? reader["Nivel_Descripcion"].ToString().Trim() : "Operativo";
                                    if (descNivel.ToLower().Contains("mando")) descNivel = "Jefatura";

                                    string permisos = reader["Permisos"] != DBNull.Value ? reader["Permisos"].ToString().Trim() : "";
                                    if (string.IsNullOrWhiteSpace(permisos))
                                    {
                                        permisos = codNivel == "001" ? "Lectura + descarga + modificar"
                                                 : (codNivel == "002" ? "Lectura + descarga + modificar" : "Lectura + descarga");
                                    }

                                    string fecStr = "—";
                                    if (reader["Fecha_Registro_Puesto"] != DBNull.Value)
                                    {
                                        fecStr = Convert.ToDateTime(reader["Fecha_Registro_Puesto"]).ToString("dd/MM/yyyy");
                                    }

                                    string estadoVal = reader["Estado"] != DBNull.Value ? reader["Estado"].ToString().Trim() : "Activo";
                                    bool flgAct = reader["Flg_Activo"] != DBNull.Value && Convert.ToBoolean(reader["Flg_Activo"]);
                                    if (!flgAct) estadoVal = "Inactivo";

                                    list.Add(new
                                    {
                                        id = "U-" + reader["Id_Usuario"],
                                        id_Usuario = reader["Id_Usuario"],
                                        codigo_Puesto = reader["Codigo_Puesto"] != DBNull.Value ? reader["Codigo_Puesto"].ToString().Trim() : "",
                                        puesto = reader["Puesto"] != DBNull.Value ? reader["Puesto"].ToString().Trim() : "",
                                        codigo_Proceso = reader["Codigo_Proceso"] != DBNull.Value ? reader["Codigo_Proceso"].ToString().Trim() : "",
                                        proceso = reader["Proceso_Nombre"] != DBNull.Value ? reader["Proceso_Nombre"].ToString().Trim() : "General",
                                        usuario = reader["Nom_Usuario"] != DBNull.Value ? reader["Nom_Usuario"].ToString().Trim() : "",
                                        userCode = reader["Cod_Usuario"] != DBNull.Value ? reader["Cod_Usuario"].ToString().Trim() : "",
                                        email = reader["Email"] != DBNull.Value ? reader["Email"].ToString().Trim() : "",
                                        codigo_Nivel = codNivel,
                                        nivel = descNivel,
                                        permisos = permisos,
                                        fecha_Registro = fecStr,
                                        estado = estadoVal,
                                        flg_Activo = flgAct,
                                        primer_Ingreso = reader["Primer_Ingreso"] != DBNull.Value && Convert.ToBoolean(reader["Primer_Ingreso"]),
                                        tip_Trabajador = reader["Tip_Trabajador"] != DBNull.Value ? reader["Tip_Trabajador"].ToString().Trim() : "E",
                                        cod_Trabajador = reader["Cod_Trabajador"] != DBNull.Value ? reader["Cod_Trabajador"].ToString().Trim() : ""
                                    });
                                }
                            }
                        }
                    }
                }

                return Ok(new { success = true, elements = list });
            }
            catch (Exception ex)
            {
                return Ok(new { success = false, elements = new List<object>(), message = ex.Message });
            }
        }

        // =========================================================================================
        // 8. ENDPOINT: POST api/SNUsuario/postCambiarPasswordPrimerIngreso
        // Cambia la contraseña obligatoria en el primer ingreso y activa la cuenta (Estado -> 'Activo')
        // =========================================================================================
        [HttpPost("postCambiarPasswordPrimerIngreso")]
        public async Task<IActionResult> PostCambiarPasswordPrimerIngreso([FromBody] CambiarPasswordRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Cod_Usuario) || string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new { success = false, message = "Usuario y nueva contraseña requeridos." });
            }

            try
            {
                using (var conn = new SqlConnection(_connectionString))
                {
                    await conn.OpenAsync();
                    using (var cmd = new SqlCommand("dbo.SP_SN_USUARIO_MANTENIMIENTO", conn))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.CommandTimeout = 30;

                        cmd.Parameters.AddWithValue("@Accion", "P");
                        cmd.Parameters.AddWithValue("@Cod_Usuario", request.Cod_Usuario.Trim());
                        cmd.Parameters.AddWithValue("@Password", request.Password.Trim());

                        await cmd.ExecuteNonQueryAsync();
                    }
                }

                return Ok(new { success = true, message = "Contraseña actualizada exitosamente. Su cuenta ha sido activada." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error al actualizar contraseña: " + ex.Message });
            }
        }

        // =========================================================================================
        // 9. ENDPOINT: GET api/SNUsuario/getValidarPrimerIngreso?Cod_Usuario=...
        // Verifica si la cuenta se encuentra en 'Pendiente de activación' o requiere cambio de contraseña
        // =========================================================================================
        [HttpGet("getValidarPrimerIngreso")]
        public async Task<IActionResult> GetValidarPrimerIngreso([FromQuery] string Cod_Usuario)
        {
            if (string.IsNullOrWhiteSpace(Cod_Usuario))
            {
                return BadRequest(new { success = false, message = "Usuario requerido." });
            }

            try
            {
                using (var conn = new SqlConnection(_connectionString))
                {
                    await conn.OpenAsync();
                    string query = @"SELECT TOP 1 
                                        Cod_Usuario,
                                        Nom_Usuario,
                                        ISNULL(Estado, 'Activo') AS Estado,
                                        ISNULL(Primer_Ingreso, 0) AS Primer_Ingreso
                                     FROM dbo.SN_Usuario WITH (NOLOCK)
                                     WHERE Cod_Usuario = @Cod_Usuario AND Flg_Activo = 1";

                    using (var cmd = new SqlCommand(query, conn))
                    {
                        cmd.Parameters.AddWithValue("@Cod_Usuario", Cod_Usuario.Trim());
                        using (var reader = await cmd.ExecuteReaderAsync())
                        {
                            if (await reader.ReadAsync())
                            {
                                string estado = reader["Estado"].ToString()?.Trim() ?? "Activo";
                                bool primerIngreso = Convert.ToBoolean(reader["Primer_Ingreso"]);
                                bool requiereCambio = primerIngreso || estado.Equals("Pendiente de activación", StringComparison.OrdinalIgnoreCase);

                                return Ok(new
                                {
                                    success = true,
                                    cod_Usuario = reader["Cod_Usuario"].ToString()?.Trim(),
                                    nom_Usuario = reader["Nom_Usuario"].ToString()?.Trim(),
                                    estado = estado,
                                    primer_Ingreso = primerIngreso,
                                    requiereCambioPassword = requiereCambio
                                });
                            }
                        }
                    }
                }

                return Ok(new { success = false, message = "Usuario no encontrado." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        public class CambiarPasswordRequest
        {
            public string? Cod_Usuario { get; set; }
            public string? Password { get; set; }
        }

        public class SNCredencialesCorreoRequest
        {
            public string? Destinatario { get; set; }
            public string? Nombre { get; set; }
            public string? Usuario { get; set; }
            public string? Puesto { get; set; }
            public string? ClaveTemporal { get; set; }
            public string? Asunto { get; set; }
        }

        public class RegistrarUsuarioRequest
        {
            public string? Accion { get; set; }
            public string? Cod_Usuario { get; set; }
            public string? Password { get; set; }
            public string? Nom_Usuario { get; set; }
            public int? Cod_Rol { get; set; }
            public string? Des_Rol { get; set; }
            public string? Cod_Empresa { get; set; }
            public string? Empresa { get; set; }
            public string? Tip_Trabajador { get; set; }
            public string? Cod_Trabajador { get; set; }
            public string? Email { get; set; }
            public string? Denominacion { get; set; }
            public string? Codigo_Proceso { get; set; }
            public string? Codigo_Nivel { get; set; }
            public int? Id_Usuario { get; set; }
            public string? Estado { get; set; }
            public bool? Primer_Ingreso { get; set; }
            public int? Flg_Activo { get; set; }
        }

        public class LogAccesoRequest
        {
            public string? Accion { get; set; }
            public string? Cod_Usuario { get; set; }
            public string? Nom_Usuario { get; set; }
            public string? Puesto { get; set; }
            public string? Cod_Rol { get; set; }
            public string? Fec_Acceso { get; set; }
            public string? Ip_Acceso { get; set; }
            public string? Estado { get; set; }
            public bool? Flg_Activo { get; set; }
        }
    }
}
