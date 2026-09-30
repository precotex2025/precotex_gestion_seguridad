using ic.backend.precotex.web.Service.Services.Implementacion.Laboratorio;
using ic.backend.precotex.web.Service.Services.Implementacion.Login;
using ic.backend.precotex.web.Service.Services.Laboratorio;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace ic.backend.precotex.web.Api.Controllers.Login
{
    [Route("api/[controller]")]
    [ApiController]
    public class TxLoginController : ControllerBase
    {
        public readonly ITxLoginService _txLoginService;

        public TxLoginController(ITxLoginService txLoginService)
        {
            _txLoginService = txLoginService;
        }

        [HttpGet]
        [Route("getGetUsuarioHabilitado")]
        public async Task<IActionResult> GetUsuarioHabilitado(string Cod_Usuario)
        {
            var result = await _txLoginService.GetUsuarioHabilitado(Cod_Usuario);
            if (result!.Success)
            {
                result.CodeResult = StatusCodes.Status200OK;
                return Ok(result);
            }

            result.CodeResult = StatusCodes.Status400BadRequest;
            return BadRequest(result);
        }

        [HttpGet]
        [Route("getGetUsuarioWeb")]
        public async Task<IActionResult> GetUsuarioWeb(string Cod_Usuario)
        {
            var result = await _txLoginService.GetUsuarioWeb(Cod_Usuario);
            if (result!.Success)
            {
                result.CodeResult = StatusCodes.Status200OK;
                return Ok(result);
            }

            result.CodeResult = StatusCodes.Status400BadRequest;
            return BadRequest(result);
        }

        [HttpGet]
        [Route("getValidaAccesoRol")]
        public async Task<IActionResult> getValidaAccesoRol(string Ruta, int Cod_Rol)
        {
            var result = await _txLoginService.ValidaAccesoRol(Ruta, Cod_Rol);
            if (result!.Success)
            {
                result.CodeResult = StatusCodes.Status200OK;
                return Ok(result);
            }

            result.CodeResult = StatusCodes.Status400BadRequest;
            return BadRequest(result);
        }
    }
}
