export const GlobalVariable = {
  vtiptra: '',
  vcodtra: '',
  vusu: '',
  vCod_Rol: 0,

  //----------------------------------------------LOCAL-----------------------------------------------

  baseUrl: "http://192.168.1.36/ws_android_dev", //LOCAL <- FRONT

  baseUrlBackEnd: "https://localhost:7093/api/", //LOCAL <- BACK (SEGURIDAD)

  //--------------------------------------------PRODUCCION--------------------------------------------

  //baseUrlBackEnd: "https://gestion.precotex.com:444/ubicaciones/api/", // PRODUCCION SEGURIDAD <- BACK

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