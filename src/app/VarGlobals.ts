export const GlobalVariable = {
  vtiptra: '',
  vcodtra: '',
  vusu: '',
  vCod_Rol: 0,

  //----------------------------------------------URL BACKEND DINÁMICA-----------------------------
  // Detección automática de entorno:
  // - Si se ejecuta en red/producción (IP de red o dominio) -> http://192.168.1.36:5252/api/
  // - Si se ejecuta en desarrollo local (localhost / 127.0.0.1) -> https://localhost:7093/api/
  _customBaseUrl: '',
  get baseUrlBackEnd(): string {
    if (this._customBaseUrl) return this._customBaseUrl;
    if (typeof window !== 'undefined' && window.location) {
      const host = window.location.hostname;
      if (host && host !== 'localhost' && host !== '127.0.0.1') {
        return "http://192.168.1.36:5252/api/";
      }
    }
    return "https://localhost:7093/api/";
  },
  set baseUrlBackEnd(val: string) {
    this._customBaseUrl = val;
  },

  num_planta: 0,
  cod_ordtra: '',
  empresa: '',
  num_movdespacho: '',
  Num_Memorandum: 0,
  Num_movstk: '',
  Cod_op: '',
  Cod_Grupo: '',
  Cod_Tela: '',
  Dato: '',
  Kgs_Tela: {
    kgs_devueltos: '',
    kgs_consumido: '',
    status_liq: '',
    kgs_atendidos: '',
    COD_COLOR: '',
    COD_COMB: '',
    COD_ORDTRA: '',
    COD_TIPORDTRA: ''
  },

  start: {},
  end: {},
  Orden_servicio: '',
  Cod_ClienteG: '',
  Cod_EstCliG: '',
  Cod_EstProG: '',
  Cod_VersionG: '',
  Flg_Estado: '',

  Cod_Registro_CabG: 0,
  ObservacionG: '',
  Cod_Registro_DetG: 0,
  Arr_ColorG: [],

  Cod_OrdProG: '',
  Cod_PresentG: '',
  Des_present: '',
  Cod_TallaG: '',
  Cant_PrendasG: 0,
  Cod_Hoja_Medida_Cab: 0,
  Cod_EstProHojaMedida: '',
  Cod_VersionHojaMedida: '',
  Accion: '',

  Arr_Medidas: [],
  Arr_Trabajadores: [],

  Global_menu: {}
};