using ic.backend.precotex.web.Api.Parameters;
using ic.backend.precotex.web.Entity.Entities.SecureNorm;
using ic.backend.precotex.web.Service.Services.Implementacion.SecureNorm;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace ic.backend.precotex.web.Api.Controllers.SecureNorm
{
    [Route("api/[controller]")]
    [ApiController]
    public class SNObjetivoController : ControllerBase
    {
        private readonly ISNObjetivoService _sNObjetivoService;

        public SNObjetivoController(ISNObjetivoService sNObjetivoService)
        {
            _sNObjetivoService = sNObjetivoService;
        }

        // ===================================================================
        // 1. MANTENIMIENTO DE OBJETIVO SIG (OBJ-01, OBJ-02)
        // ===================================================================
        [HttpPost]
        [Route("postObjetivoMnto")]
        public async Task<IActionResult> postObjetivoMnto([FromBody] SNObjetivoParameter parametros)
        {
            if (parametros == null)
            {
                return BadRequest(new { Success = false, Message = "Los parámetros enviados son nulos." });
            }

            string codigoFinal = !string.IsNullOrEmpty(parametros.Codigo)
                ? parametros.Codigo
                : "OBJ-" + DateTime.Now.Year + "-001";

            SN_Objetivo objetivo = new SN_Objetivo
            {
                Id_Objetivo = parametros.Id_Objetivo ?? 0,
                Codigo = codigoFinal,
                Nombre = parametros.Nombre ?? parametros.Objetivo ?? "",
                Proceso = parametros.Proceso ?? "SSOMA",
                Norma = parametros.Norma ?? "ISO 9001:2015",
                Periodo = parametros.Periodo ?? "2026",                                         // OBJ-01
                Responsable_Proceso = parametros.Responsable_Proceso ?? parametros.ResponsableProceso ?? "Jefe de Proceso", // OBJ-01
                Fecha_Inicio = parametros.Fecha_Inicio ?? parametros.FechaInicio,              // OBJ-01
                Fecha_Fin = parametros.Fecha_Fin ?? parametros.FechaFin,                        // OBJ-01
                Responsable_Seguimiento = parametros.Responsable_Seguimiento ?? parametros.ResponsableSeguimiento ?? "Coordinador SIG", // OBJ-01
                Medio_Verificacion = parametros.Medio_Verificacion ?? parametros.MedioVerificacion ?? "Reportes de Gestión",         // OBJ-01
                Indicador = parametros.Indicador ?? "% Cumplimiento",
                Formula_Calculo = parametros.Formula_Calculo ?? parametros.FormulaCalculo ?? "(Real / Plan) * 100",                 // OBJ-01
                Unidad_Medida = parametros.Unidad_Medida ?? parametros.UnidadMedida ?? "%",                                         // OBJ-01
                Base = parametros.Base ?? "0%",
                Meta = parametros.Meta ?? 100,
                Avance = parametros.Avance ?? parametros.PorcentajeAvance ?? 0,                // OBJ-01
                Frecuencia = parametros.Frecuencia ?? "Mensual",
                Estado = parametros.Estado ?? "Planificado",
                Descripcion = parametros.Descripcion ?? parametros.Desc ?? "",
                Usuario_Registro = parametros.Usuario_Registro ?? "SISTEMAS"
            };

            var result = await _sNObjetivoService.Mnto(objetivo, parametros.Accion!);
            if (result.Success)
            {
                result.CodeResult = result.CodeTransacc == 1 ? StatusCodes.Status200OK : StatusCodes.Status201Created;
                return Ok(result);
            }

            result.CodeResult = StatusCodes.Status400BadRequest;
            return BadRequest(result);
        }

        // ===================================================================
        // 2. LISTADO DE OBJETIVOS SIG (OBJ-01)
        // ===================================================================
        [HttpGet]
        [Route("getListadoObjetivos")]
        public async Task<IActionResult> getListadoObjetivos(string? sFiltro)
        {
            var result = await _sNObjetivoService.Listado(sFiltro ?? "");
            if (result!.Success)
            {
                result.CodeResult = StatusCodes.Status200OK;
                return Ok(result);
            }

            result.CodeResult = StatusCodes.Status400BadRequest;
            return BadRequest(result);
        }

        // ===================================================================
        // 3. HISTORIAL DE MEDICIONES DE OBJETIVOS
        // ===================================================================
        [HttpGet]
        [Route("getListadoObjetivoMediciones")]
        public async Task<IActionResult> getListadoObjetivoMediciones(int? idObjetivo, string? sFiltro)
        {
            var result = await _sNObjetivoService.ListadoMediciones(idObjetivo, sFiltro ?? "");
            if (result!.Success)
            {
                result.CodeResult = StatusCodes.Status200OK;
                return Ok(result);
            }

            result.CodeResult = StatusCodes.Status400BadRequest;
            return BadRequest(result);
        }

        // ===================================================================
        // 4. MANTENIMIENTO DE MEDICIÓN DE OBJETIVOS
        // ===================================================================
        [HttpPost]
        [Route("postProcesoMntoObjetivoMedicion")]
        public async Task<IActionResult> postProcesoMntoObjetivoMedicion([FromBody] SNObjetivoMedicionParameter parametros)
        {
            SN_Objetivo_Medicion medicion = new SN_Objetivo_Medicion
            {
                Id_Obj_Medicion = parametros.Id_Obj_Medicion ?? 0,
                Id_Objetivo = parametros.Id_Objetivo ?? 0,
                Codigo_Objetivo = parametros.Codigo_Objetivo,
                Periodo = parametros.Periodo ?? "",
                Valor = parametros.Valor ?? 0,
                Usuario_Registro = parametros.Usuario_Registro ?? "SISTEMAS"
            };

            var result = await _sNObjetivoService.MntoMedicion(medicion, parametros.Accion!);
            if (result.Success)
            {
                result.CodeResult = result.CodeTransacc == 1 ? StatusCodes.Status200OK : StatusCodes.Status201Created;
                return Ok(result);
            }

            result.CodeResult = StatusCodes.Status400BadRequest;
            return BadRequest(result);
        }
    }
}
