import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';

export interface Plantilla5w2hData {
  titulo?: string;
  codigo?: string;
  proceso?: string;
  sede?: string;
  faseInicial?: 'ir-ver' | 'pensar' | 'hacer';
  onDescargar?: () => void;
}

@Component({
  selector: 'app-plantilla-5w2h-modal',
  standalone: false,
  templateUrl: './plantilla-5w2h-modal.component.html',
  styleUrls: ['./plantilla-5w2h-modal.component.css']
})
export class Plantilla5w2hModalComponent implements OnInit {

  faseActiva: 'ir-ver' | 'pensar' | 'hacer' = 'ir-ver';

  // Metadatos
  codigoFormato = 'FOR-IMC-OYM-005';
  versionFormato = '03';
  fechaAprobacion = '30/04/2026';
  codigoAcr = 'ACR-2026-001';

  provenienteOptions = [
    { label: 'Auditoría', checked: true },
    { label: 'Inspección', checked: false },
    { label: 'Seguimiento de Desempeño', checked: false },
    { label: 'Incidente', checked: false },
    { label: 'Acuerdo Comité SST', checked: false },
    { label: 'Informes Organismos de Control', checked: false },
    { label: 'Queja', checked: false },
    { label: 'Reclamo', checked: false },
    { label: 'Sugerencia de Personal', checked: false }
  ];

  sistemasOptions = [
    { label: 'Calidad', checked: true },
    { label: 'Inocuidad', checked: false },
    { label: 'Seg. Ocupacional', checked: true },
    { label: 'Medio Ambiente', checked: false }
  ];

  tipoOptions = [
    { label: 'No Conformidad', checked: true },
    { label: 'Oportunidad de Mejora', checked: false }
  ];

  // 1. INFORMACIÓN GENERAL
  infoGeneral = {
    problema: 'Desviación recurrente en control de temperatura y sellado de empaques en línea 2',
    lineaArea: 'Planta Ate — Tintorería y Acabados / Máquina Rama 04',
    fechaOcurrencia: new Date().toISOString().slice(0, 10),
    haOcurridoAntes: 'Sí, se observó evento similar el mes previo tras cambio de lote de insumos',
    liderEquipo: 'Carlos Ríos — Supervisor de Aseguramiento de Calidad',
    participantes: 'Jordan Pinedo (Producción), Rosa Chávez (Mantenimiento), Mario Torres (SSOMA)',
    fechaAnalisis: new Date().toISOString().slice(0, 10)
  };

  // 2. METODOLOGÍA 5W Y 2H
  preguntas5w2h = [
    { key: 'What (¿Qué?)', label: '¿Qué?', desc: 'Describir el problema o desviación encontrada', val: 'Paradas no programadas por descalibración de termocupla en el sistema de fijado.' },
    { key: 'When (¿Cuándo?)', label: '¿Cuándo?', desc: 'Momento o turno en que se identificó', val: 'Turno mañana 08:30 hrs durante la corrida de producción de exportación.' },
    { key: 'Where (¿Dónde?)', label: '¿Dónde?', desc: 'Lugar exacto, equipo o puesto de trabajo', val: 'Área de Acabados Textil, Máquina Rama 04, Cabina de Control Térmico.' },
    { key: 'Why (¿Por qué?)', label: '¿Por qué?', desc: 'Razón principal por la que genera impacto', val: 'Porque provoca alteración en el ancho y tono del tejido, generando reprocesos.' },
    { key: 'Who (¿Quién?)', label: '¿Quién?', desc: 'Personal involucrado o responsable del proceso', val: 'Operador de máquina y técnico de mantenimiento asignado al turno.' },
    { key: 'How (¿Cómo?)', label: '¿Cómo?', desc: 'Modo en que se manifiesta la desviación', val: 'Lectura errática en display de temperatura con variaciones de +/- 15°C.' },
    { key: 'How Much (¿Cuánto?)', label: '¿Cuánto?', desc: 'Costo, tiempo perdido o merma ocasionada', val: 'Aprox. 45 metros de tela con variación y 2.5 horas de tiempo improductivo.' }
  ];

  // 4. DIAGRAMA DE ISHIKAWA (7M)
  ishikawa7M = [
    {
      categoria: 'Mano de Obra',
      icon: 'engineering',
      causas: ['Falta de inducción en calibración rápida', 'Rotación reciente de operador en turno B']
    },
    {
      categoria: 'Materiales',
      icon: 'inventory_2',
      causas: ['Lote de repuesto de sensor con especificación no homologada']
    },
    {
      categoria: 'Método',
      icon: 'format_list_numbered',
      causas: ['Procedimiento de verificación previa no actualizado a v2', 'Ausencia de checklist diario']
    },
    {
      categoria: 'Management',
      icon: 'groups',
      causas: ['Supervisión intermitente por cobertura de turnos paralelos']
    },
    {
      categoria: 'Maquinaria',
      icon: 'precision_manufacturing',
      causas: ['Desgaste mecánico en cableado de sensor termocupla', 'Vibración excesiva en bastidor']
    },
    {
      categoria: 'Medida',
      icon: 'straighten',
      causas: ['Frecuencia de calibración mensual insuficiente para régimen 24/7']
    },
    {
      categoria: 'Medio Ambiente',
      icon: 'thermostat',
      causas: ['Alta humedad relativa y temperatura ambiental en sala de ramas']
    }
  ];

  // 5. RCA-5 POR QUÉ
  filas5PorQue = [
    {
      id: 1,
      causaPosible: 'Variación de temperatura en cabina de secado',
      pq1: '¿Por qué? Sensor termocupla envió lectura errónea al PLC.',
      pq2: '¿Por qué? El cableado presentaba falso contacto interno por vibración.',
      pq3: '¿Por qué? No se instaló el soporte antivibratorio estándar en el último mantenimiento.',
      pq4: '¿Por qué? El técnico no contaba con la ficha técnica de instalación específica.',
      pq5: '¿Por qué? (Causa Raíz) No existía procedimiento estandarizado para reemplazo de sensores críticos.'
    },
    {
      id: 2,
      causaPosible: 'Operador no detectó la oscilación térmica oportunamente',
      pq1: '¿Por qué? La alarma visual en panel principal estaba atenuada por polvo.',
      pq2: '¿Por qué? La rutina de limpieza de tableros de control no incluía señalización luminosa.',
      pq3: '¿Por qué? Se priorizaba solo la limpieza de filtros y rodillos.',
      pq4: '¿Por qué? La matriz de mantenimiento autónomo no contemplaba componentes eléctricos externos.',
      pq5: '¿Por qué? (Causa Raíz) Falta de integración entre mantenimiento predictivo y plan de 5S en línea.'
    }
  ];

  // 6. ACCIONES CORRECTIVAS (HACER)
  accionesCorrectivas = [
    {
      causaRaiz: 'Falta de procedimiento estandarizado de instalación de sensores',
      accion: 'Elaborar e implementar estándar técnico de montaje antivibratorio para sensores en Ramas.',
      responsable: 'Jefe de Mantenimiento / Ing. Electrónico',
      inicio: '2026-05-02',
      fin: '2026-05-16',
      estatus: 'Cerrado'
    },
    {
      causaRaiz: 'Inspección de alarmas y tableros no integrada en mantenimiento',
      accion: 'Actualizar matriz de inspección autónoma (AM) e incorporar verificación de balizas y alarmas.',
      responsable: 'Supervisor de Producción / Lider 5S',
      inicio: '2026-05-10',
      fin: '2026-05-25',
      estatus: 'En proceso'
    },
    {
      causaRaiz: 'Homologación de repuestos de control térmico',
      accion: 'Establecer criterio de homologación previa con compras para insumos de instrumentación crítica.',
      responsable: 'Aseguramiento de la Calidad / Compras',
      inicio: '2026-05-18',
      fin: '2026-06-05',
      estatus: 'Pendiente'
    }
  ];

  // 7. VERIFICACIÓN DE EFECTIVIDAD
  verificacion = {
    indicador: 'Índice de Confiabilidad Térmica en Ramas (%) / Horas de parada por calibración',
    antes: '3 incidentes mensuales de variación térmica y 8.5 horas promedio de tiempo improductivo al mes.',
    despues: '0 eventos de oscilación en los últimos 45 días y variabilidad controlada dentro de +/- 2°C.',
    responsable: 'Ing. Fernando Huamaní — Jefe de Organización y Métodos / SIG',
    fecha: new Date().toISOString().slice(0, 10),
    firma: 'F. Huamaní (Validado electrónicamente)',
    comentarios: 'La acción correctiva ha eliminado la causa raíz. Se valida la efectividad del estándar y se autoriza el cierre formal del ACR.'
  };

  constructor(
    public dialogRef: MatDialogRef<Plantilla5w2hModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Plantilla5w2hData,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    if (this.data) {
      if (this.data.faseInicial) this.faseActiva = this.data.faseInicial;
      if (this.data.titulo) this.infoGeneral.problema = this.data.titulo;
      if (this.data.codigo) this.codigoAcr = this.data.codigo;
      if (this.data.proceso) this.infoGeneral.lineaArea = `${this.data.sede || 'Planta Ate'} — ${this.data.proceso}`;
    }
  }

  setFase(fase: 'ir-ver' | 'pensar' | 'hacer'): void {
    this.faseActiva = fase;
  }

  onDescargarExcel(): void {
    if (this.data && this.data.onDescargar) {
      this.data.onDescargar();
      this.toastr.success('Plantilla oficial FOR-IMC-OYM-001 generada y descargada en Excel.', 'Descarga Exitosa');
    } else {
      this.dialogRef.close({ accion: 'descargarExcel' });
    }
  }

  onCerrar(): void {
    this.dialogRef.close(null);
  }
}
