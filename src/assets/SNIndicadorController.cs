using ic.backend.precotex.web.Api.Parameters;
using ic.backend.precotex.web.Entity.Entities.SecureNorm;
using ic.backend.precotex.web.Service.Services.Implementacion.SecureNorm;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace ic.backend.precotex.web.Api.Controllers.SecureNorm
{
    [Route("api/[controller]")]
    [ApiController]
    public class SNIndicadorController : ControllerBase
    {
        private readonly ISNIndicadorService _sNIndicadorService;

        public SNIndicadorController(ISNIndicadorService sNIndicadorService)
        {
            _sNIndicadorService = sNIndicadorService;
        }

        // ===================================================================
        // 1. REGISTRO Y MANTENIMIENTO DE INDICADORES (CATÁLOGO BASE)
        // ===================================================================
        [HttpPost]
        [Route("postIndicadorMnto")]
        public async Task<IActionResult> postIndicadorMnto([FromBody] SNIndicadorParameter parametros)
        {
            if (parametros == null)
            {
                return BadRequest(new { Success = false, Message = "Los parámetros enviados son nulos." });
            }

            SN_Indicador indicador = new SN_Indicador
            {
                Id_Indicador = parametros.Id_Indicador ?? 0,
                Codigo = parametros.Codigo,
                Nombre = parametros.Nombre,
                Tipo = parametros.Tipo ?? "Eficiencia",                     // IND-02: Tipo
                Sede = parametros.Sede ?? "Todas",                          // IND-02: Sede
                Norma = parametros.Norma ?? "ISO 9001:2015",                // IND-02: Norma ISO
                Frecuencia = parametros.Frecuencia ?? "Mensual",            // IND-02: Frecuencia
                Meta = parametros.Meta ?? 0,                                // IND-02: Meta Base
                Unidad_Medida = parametros.Unidad_Medida ?? "%",
                Tipo_Meta = parametros.Tipo_Meta,
                Sentido = parametros.Sentido,
                Linea_Base = parametros.Linea_Base,
                Formula = parametros.Formula,
                Codigo_Proceso = parametros.Codigo_Proceso,
                Nombre_Proceso = parametros.Nombre_Proceso,
                Responsable = parametros.Responsable,
                Resp_Medicion = parametros.Resp_Medicion,
                Fuente_Datos = parametros.Fuente_Datos,
                Fec_Inicio = parametros.Fec_Inicio,
                Fec_Fin = parametros.Fec_Fin,
                Areas_Acceso = parametros.Areas_Acceso,
                Estado = parametros.Estado ?? "Activo",
                Usuario_Registro = parametros.Usuario_Registro ?? "SISTEMAS"
            };

            var result = await _sNIndicadorService.Mnto(indicador, parametros.Accion ?? "I");
            if (result != null && result.Success)
            {
                result.CodeResult = result.CodeTransacc == 1 ? StatusCodes.Status200OK : StatusCodes.Status201Created;
                return Ok(result);
            }

            return BadRequest(result ?? new { Success = false, Message = "Error al ejecutar el mantenimiento del indicador." });
        }

        // ===================================================================
        // 2. LISTADO DE INDICADORES DEL CATÁLOGO
        // ===================================================================
        [HttpGet]
        [Route("getListadoIndicadores")]
        public async Task<IActionResult> getListadoIndicadores([FromQuery] string? sFiltro = "")
        {
            var result = await _sNIndicadorService.Listado(sFiltro ?? "");
            if (result != null && result.Success)
            {
                result.CodeResult = StatusCodes.Status200OK;
                return Ok(result);
            }

            return BadRequest(result ?? new { Success = false, Message = "Error al obtener el listado de indicadores de la Base de Datos." });
        }

        // ===================================================================
        // 3. HISTORIAL DE MEDICIONES DE INDICADORES (IND-02)
        // ===================================================================
        [HttpGet]
        [Route("getListadoIndicadorMediciones")]
        public async Task<IActionResult> getListadoIndicadorMediciones([FromQuery] int? idIndicador = null, [FromQuery] string? sFiltro = "")
        {
            var result = await _sNIndicadorService.ListadoMediciones(idIndicador, sFiltro ?? "");
            if (result != null && result.Success)
            {
                result.CodeResult = StatusCodes.Status200OK;
                return Ok(result);
            }

            return BadRequest(result ?? new { Success = false, Message = "Error al obtener el historial de mediciones de la Base de Datos." });
        }

        // ===================================================================
        // 4. REGISTRO Y MANTENIMIENTO DE MEDICIÓN PERIÓDICA (IND-02)
        // ===================================================================
        [HttpPost]
        [Route("postProcesoMntoIndicadorMedicion")]
        public async Task<IActionResult> postProcesoMntoIndicadorMedicion([FromBody] SNIndicadorMedicionParameter parametros)
        {
            if (parametros == null)
            {
                return BadRequest(new { Success = false, Message = "Los parámetros de medición enviados son nulos." });
            }

            string codigoFinal = !string.IsNullOrEmpty(parametros.Codigo_Indicador) 
                ? parametros.Codigo_Indicador 
                : (!string.IsNullOrEmpty(parametros.Indicador) ? parametros.Indicador : "IND-2026-001");

            string nombreFinal = !string.IsNullOrEmpty(parametros.Nombre_Indicador) 
                ? parametros.Nombre_Indicador 
                : (!string.IsNullOrEmpty(parametros.Indicador) ? parametros.Indicador : "Indicador " + codigoFinal);

            SN_Indicador_Medicion medicion = new SN_Indicador_Medicion
            {
                Id_Medicion = parametros.Id_Medicion ?? 0,
                Id_Indicador = parametros.Id_Indicador ?? 0,
                Codigo_Indicador = codigoFinal,
                Nombre_Indicador = nombreFinal,
                Tipo = parametros.Tipo ?? "Eficacia",                                     // IND-02: Tipo
                Sede = parametros.Sede ?? "Todas",                                       // IND-02: Sede
                Proceso = parametros.Proceso ?? "SSOMA",                                 // IND-02: Proceso
                Norma = parametros.Norma ?? "ISO 9001:2015",                             // IND-02: Norma ISO
                Frecuencia = parametros.Frecuencia ?? "Mensual",                         // IND-02: Frecuencia
                Meta = parametros.Meta ?? 85,                                            // IND-02: Meta
                Periodo = parametros.Periodo ?? "2026-Q1",
                Valor_Obtenido = parametros.Valor_Obtenido ?? 0,
                Semaforo = parametros.Semaforo ?? "En meta",
                Evidencia = parametros.Evidencia ?? parametros.Archivo_Evidencia ?? "",   // IND-08: Evidencia
                Comentario = parametros.Comentario ?? "",
                Usuario_Registro = parametros.Usuario_Registro ?? "SISTEMAS"
            };

            var result = await _sNIndicadorService.MntoMedicion(medicion, parametros.Accion ?? "I");
            if (result != null && result.Success)
            {
                result.CodeResult = result.CodeTransacc == 1 ? StatusCodes.Status200OK : StatusCodes.Status201Created;
                return Ok(result);
            }

            return BadRequest(result ?? new { Success = false, Message = "Error al registrar/actualizar la medición en la Base de Datos." });
        }
    }
}
