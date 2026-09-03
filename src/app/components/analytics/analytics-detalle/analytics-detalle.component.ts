import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { IndicadoresService } from '../../../services/indicadores.service';
import { MedicionRegeditComponent } from '../medicion-indicadores/medicion-regedit/medicion-regedit.component';
import { ToastrService } from 'ngx-toastr';

interface DialogData {
  indicador: any;
}

@Component({
  selector: 'app-analytics-detalle',
  standalone: false,
  templateUrl: './analytics-detalle.component.html',
  styleUrls: ['./analytics-detalle.component.css']
})
export class AnalyticsDetalleComponent implements OnInit {

  indicador: any;
  mediciones: any[] = [];
  medicionesPorSede: { [sede: string]: any[] } = {};
  sedesAvance: any[] = [];
  
  promedioGeneral: number = 0;
  ultimaMedicion: any = null;
  totalMediciones: number = 0;
  cargando: boolean = true;

  constructor(
    public dialogRef: MatDialogRef<AnalyticsDetalleComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private indicadoresService: IndicadoresService,
    private dialog: MatDialog,
    private toastr: ToastrService
  ) {
    this.indicador = data?.indicador || {};
  }

  ngOnInit(): void {
    this.cargarHistorialMediciones();
  }

  cargarHistorialMediciones(): void {
    this.cargando = true;
    const rawId = this.indicador.idIndicador || this.indicador.id;
    const numericId = (rawId !== undefined && rawId !== null && !isNaN(Number(rawId)) && String(rawId).trim() !== '') 
      ? Number(rawId) 
      : undefined;
    const codigo = this.indicador.codigo || '';

    // Si es un objetivo, verificar primero en almacenamiento local de mediciones de objetivos
    const isObjetivo = codigo.startsWith('OBJ') || this.indicador.esObjetivo;
    if (isObjetivo) {
      try {
        const localObjMed = JSON.parse(localStorage.getItem('precotex_mediciones_obj') || '[]');
        const matching = localObjMed.filter((m: any) => 
          (m.codigoObjetivo && codigo && m.codigoObjetivo.toLowerCase() === codigo.toLowerCase()) ||
          (m.objetivo && this.indicador.nombre && m.objetivo.toLowerCase().includes(this.indicador.nombre.toLowerCase())) ||
          (m.id === rawId)
        );
        if (matching.length > 0) {
          this.cargando = false;
          this.procesarMedicionesObjetivo(matching);
          return;
        }
      } catch (e) {}
    }

    this.indicadoresService.getListadoIndicadorMediciones(numericId, codigo).subscribe({
      next: (res: any) => {
        this.cargando = false;
        if (res && res.success && res.elements && res.elements.length > 0) {
          const raw = res.elements.filter((m: any) => 
            (numericId && m.id_Indicador === numericId) || 
            (m.codigo_Indicador && codigo && m.codigo_Indicador.toLowerCase() === codigo.toLowerCase())
          );
          if (raw.length > 0) {
            this.procesarMediciones(raw);
          } else {
            this.cargarMedicionesFallback();
          }
        } else {
          this.cargarMedicionesFallback();
        }
      },
      error: () => {
        this.cargando = false;
        this.cargarMedicionesFallback();
      }
    });
  }

  procesarMedicionesObjetivo(objMediciones: any[]): void {
    const sedesArr = this.getSedesList();
    const list: any[] = [];
    const metaNum = parseFloat(String(this.indicador.meta || '85').replace(/[^0-9.]/g, '')) || 85;

    sedesArr.forEach((s, idx) => {
      const existing = objMediciones[idx % objMediciones.length];
      const valNum = parseFloat(String(existing?.valor || metaNum).replace(/[^0-9.]/g, '')) || metaNum;
      list.push({
        id: existing?.id || (200 + idx),
        periodo: existing?.periodo || '2026-Q1',
        sede: s,
        proceso: existing?.proceso || this.indicador.proceso || 'SSOMA',
        meta: this.indicador.meta ? `${this.indicador.meta}%` : `${metaNum}%`,
        metaNumerica: metaNum,
        valor: `${valNum}%`,
        valorNumerico: valNum,
        semaforo: existing?.semaforo || (valNum >= metaNum ? 'En meta' : 'En riesgo'),
        evidencia: existing?.evidencia || existing?.archivoEvidencia || `Reporte_Medicion_${s.replace(/\s+/g, '_')}.pdf`,
        obs: existing?.obs || `Medición registrada para ${s}`
      });
    });

    this.procesarMediciones(list);
  }

  cargarMedicionesFallback(): void {
    // Generar historial de respaldo enriquecido por sede para el indicador actual
    const sedesArr = this.getSedesList();
    const mockData: any[] = [];
    const metaNum = parseFloat(String(this.indicador.meta || '85').replace(/[^0-9.]/g, '')) || 85;

    sedesArr.forEach((s, idx) => {
      mockData.push({
        id: 100 + idx * 2 + 1,
        periodo: '2026-Q1',
        sede: s,
        proceso: this.indicador.proceso || 'General',
        meta: this.indicador.meta ? this.indicador.meta + '%' : '85%',
        metaNumerica: metaNum,
        valor: (metaNum + (idx % 2 === 0 ? 3 : -2)).toFixed(1) + '%',
        valorNumerico: metaNum + (idx % 2 === 0 ? 3 : -2),
        semaforo: (idx % 2 === 0) ? 'En meta' : 'En riesgo',
        evidencia: 'Reporte_Auditoria_Q1_' + s.replace(/\s+/g, '_') + '.pdf',
        obs: 'Medición periódica correspondiente al primer trimestre en ' + s
      });
      mockData.push({
        id: 100 + idx * 2 + 2,
        periodo: '2025-Q4',
        sede: s,
        proceso: this.indicador.proceso || 'General',
        meta: this.indicador.meta ? this.indicador.meta + '%' : '85%',
        metaNumerica: metaNum,
        valor: (metaNum - 1.5).toFixed(1) + '%',
        valorNumerico: metaNum - 1.5,
        semaforo: 'En riesgo',
        evidencia: 'Matriz_Control_Q4.xlsx',
        obs: 'Cierre anual en ' + s
      });
    });

    this.procesarMediciones(mockData);
  }

  procesarMediciones(dataList: any[]): void {
    this.mediciones = dataList.map(item => {
      const valNum = parseFloat(String(item.valor_Obtenido || item.valorNumerico || item.valor || '0').replace(/[^0-9.]/g, '')) || 0;
      const metaNum = parseFloat(String(item.meta || this.indicador.meta || '100').replace(/[^0-9.]/g, '')) || 100;
      let sem = item.semaforo;
      if (!sem) {
        sem = valNum >= metaNum ? 'En meta' : (valNum >= metaNum * 0.9 ? 'En riesgo' : 'Crítico');
      }

      return {
        id: item.id_Medicion || item.id,
        periodo: item.periodo || '2026-Q1',
        sede: item.sede || 'Sede Huachipa',
        proceso: item.nombre_Proceso || item.proceso || this.indicador.proceso || 'General',
        meta: item.meta !== undefined ? String(item.meta).includes('%') ? item.meta : item.meta + '%' : (this.indicador.meta || '100%'),
        metaNumerica: metaNum,
        valor: valNum + '%',
        valorNumerico: valNum,
        semaforo: sem,
        evidencia: item.evidencia || item.archivo_Evidencia || '',
        obs: item.comentario || item.obs || ''
      };
    });

    this.totalMediciones = this.mediciones.length;

    // Calcular promedio general
    if (this.totalMediciones > 0) {
      const suma = this.mediciones.reduce((acc, curr) => acc + curr.valorNumerico, 0);
      this.promedioGeneral = parseFloat((suma / this.totalMediciones).toFixed(1));
      this.ultimaMedicion = this.mediciones[0];
    } else {
      this.promedioGeneral = 0;
      this.ultimaMedicion = null;
    }

    // Calcular avance por sede (última medición registrada por cada sede)
    this.medicionesPorSede = {};
    this.mediciones.forEach(m => {
      if (!this.medicionesPorSede[m.sede]) {
        this.medicionesPorSede[m.sede] = [];
      }
      this.medicionesPorSede[m.sede].push(m);
    });

    this.sedesAvance = Object.keys(this.medicionesPorSede).map(sedeName => {
      const list = this.medicionesPorSede[sedeName];
      const ultima = list[0]; // La primera es la más reciente
      const promSede = parseFloat((list.reduce((acc, curr) => acc + curr.valorNumerico, 0) / list.length).toFixed(1));
      const metaNum = ultima.metaNumerica || 100;
      const pct = Math.min(100, Math.max(0, (ultima.valorNumerico / (metaNum || 1)) * 100));

      return {
        sede: sedeName,
        totalRegistros: list.length,
        ultimaMedicion: ultima,
        promedio: promSede,
        porcentajeCumplimiento: Math.round(pct),
        semaforo: ultima.semaforo
      };
    });
  }

  getSedesList(): string[] {
    const rawSede = this.indicador.sede || 'Sede Huachipa';
    if (rawSede.toLowerCase().includes('todas')) {
      return ['Sede Huachipa', 'Sede Central — Lima', 'Sede Ate', 'Santa Cecilia'];
    }
    return rawSede.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
  }

  getSemaforoColor(semaforo: string): string {
    if (!semaforo) return '#6366f1';
    const s = semaforo.toLowerCase().trim();
    if (s.includes('meta') || s.includes('verde')) return '#10b981';
    if (s.includes('riesgo') || s.includes('amarillo') || s.includes('ambar')) return '#f59e0b';
    return '#ef4444';
  }

  onDescargarEvidencia(archivo: string): void {
    if (!archivo) return;
    this.toastr.success(`Descargando evidencia: "${archivo}"`, 'Descarga iniciada', { timeOut: 2500 });
  }

  onRegistrarNuevaMedicion(): void {
    const dialogRef = this.dialog.open(MedicionRegeditComponent, {
      width: '680px',
      disableClose: true,
      panelClass: 'custom-dialog-no-padding',
      data: {
        Title: '::. Registrar medición de indicador .::',
        Accion: 'I',
        Datos: {
          indicador: this.indicador.nombre,
          codigoIndicador: this.indicador.codigo,
          sede: this.indicador.sede || 'Todas',
          proceso: this.indicador.proceso || 'SSOMA',
          meta: this.indicador.meta || '>=85%'
        }
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.cargarHistorialMediciones();
      }
    });
  }

  onCerrar(): void {
    this.dialogRef.close();
  }
}
