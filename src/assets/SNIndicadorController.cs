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
                Tipo = parametros.Tipo ?? "Eficiencia",
                Sede = parametros.Sede ?? "Todas",
                Norma = parametros.Norma ?? "ISO 9001:2015",
                Frecuencia = parametros.Frecuencia ?? "Mensual",
                Meta = parametros.Meta ?? 0,
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
                Fec_Inicio = parametros.Fec_Inicio ?? parametros.Fecha_Inicio,
                Fec_Fin = parametros.Fec_Fin ?? parametros.Fecha_Fin,
                Fecha_Inicio = parametros.Fecha_Inicio ?? parametros.Fec_Inicio,
                Fecha_Fin = parametros.Fecha_Fin ?? parametros.Fec_Fin,
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

            if (result != null)
            {
                result.CodeResult = StatusCodes.Status400BadRequest;
                return BadRequest(result);
            }

            return BadRequest(new { Success = false, Message = "Error al ejecutar el mantenimiento del indicador." });
        }

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

            if (result != null)
            {
                result.CodeResult = StatusCodes.Status400BadRequest;
                return BadRequest(result);
            }

            return BadRequest(new { Success = false, Message = "Error al obtener el listado de indicadores de la Base de Datos." });
        }

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

            if (result != null)
            {
                result.CodeResult = StatusCodes.Status400BadRequest;
                return BadRequest(result);
            }

            return BadRequest(new { Success = false, Message = "Error al obtener el historial de mediciones de la Base de Datos." });
        }

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
                Nombre_Proceso = parametros.Nombre_Proceso ?? parametros.Proceso,
                Meta = parametros.Meta ?? 85,
                Periodo = parametros.Periodo ?? "",
                Valor_Obtenido = parametros.Valor_Obtenido ?? 0,
                Semaforo = parametros.Semaforo ?? "En meta",
                Comentario = parametros.Comentario ?? "",
                Usuario_Registro = parametros.Usuario_Registro ?? "SISTEMAS"
            };

            var result = await _sNIndicadorService.MntoMedicion(medicion, parametros.Accion ?? "I");
            if (result != null && result.Success)
            {
                result.CodeResult = result.CodeTransacc == 1 ? StatusCodes.Status200OK : StatusCodes.Status201Created;
                return Ok(result);
            }

            if (result != null)
            {
                result.CodeResult = StatusCodes.Status400BadRequest;
                return BadRequest(result);
            }

            return BadRequest(new { Success = false, Message = "Error al registrar/actualizar la medición en la Base de Datos." });
        }
    }
}
