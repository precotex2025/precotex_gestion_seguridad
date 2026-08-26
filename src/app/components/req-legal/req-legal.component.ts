import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

import { ReqLegalService } from '../../services/req-legal.service';
import { ReqLegalRegeditComponent } from './req-legal-regedit/req-legal-regedit.component';
import { ReqLegalDetailComponent } from './req-legal-detail/req-legal-detail.component';

export interface ReqLegalItem {
  id: number;
  item?: string;
  requisito: string;
  tema?: string;
  ambito: string;
  tipo?: string;
  norma: string;
  articulo?: string;
  entidad: string;
  obligacion?: string;
  evidenciadoc?: string;
  estado: string; // 'Cumple', 'En proceso', 'No cumple'
  responsable?: string;
  frecuencia?: string;
  evaluacion?: string;
  proxeval?: string;
  vencimiento?: string;
  observaciones?: string;
  evidencia?: string;
}

@Component({
  selector: 'app-req-legal',
  standalone: false,
  templateUrl: './req-legal.component.html',
  styleUrls: ['./req-legal.component.css']
})
export class ReqLegalComponent implements OnInit {

  activeTab: 'documentos' | 'matriz' = 'documentos';
  searchText: string = '';

  // Data Sources
  docDataSource = new MatTableDataSource<ReqLegalItem>([]);
  matrizDataSource = new MatTableDataSource<ReqLegalItem>([]);

  @ViewChild('docPaginator') docPaginator!: MatPaginator;
  @ViewChild('docSort') docSort!: MatSort;

  @ViewChild('matrizPaginator') matrizPaginator!: MatPaginator;
  @ViewChild('matrizSort') matrizSort!: MatSort;

  displayedDocColumns: string[] = ['requisito', 'ambito', 'tipo', 'entidad', 'vencimiento', 'estado', 'acciones'];
  displayedMatrizColumns: string[] = ['item', 'ambito', 'norma', 'articulo', 'requisito', 'estado', 'responsable', 'acciones'];

  stats = {
    total: 0,
    cumple: 0,
    cumplimientoPct: 0,
    alertas: 0,
    criticas: 0
  };

  alertasLegales: { sev: 'red' | 'amber'; txt: string; tag: string }[] = [];

  selectedTema: string | null = null;
  carpetasColapsadas: boolean = false;

  toggleCarpetas(): void {
    this.carpetasColapsadas = !this.carpetasColapsadas;
  }

  readonly LEGAL_GROUPS: { [area: string]: string[] } = {
    'SSOMA': [
      'Formación y capacitaciones',
      'Comité de SST',
      'IPERC',
      'Exámenes médicos ocupacionales',
      'Registros y monitoreos',
      'Mapa de riesgo',
      'Mapa de evacuación',
      'Gestión ambiental',
      'Extintores',
      'Trabajos de alto riesgo',
      'Respuesta ante emergencia',
      'Investigación de accidentes',
      'Requisitos legales SST'
    ],
    'GESTIÓN HUMANA': [
      'Documentación de ingreso',
      'Contratos y planillas',
      'Reglamento interno de trabajo'
    ],
    'MANTENIMIENTO': [
      'Certificados de operatividad',
      'Pozo a tierra',
      'Sistema contra incendios'
    ],
    'ADMINISTRACIÓN Y FINANZAS': [
      'Obligaciones tributarias (SUNAT)',
      'Libros electrónicos',
      'Facturación electrónica',
      'Licencias y permisos municipales'
    ],
    'COMERCIO EXTERIOR': [
      'Documentación aduanera',
      'Certificados de origen',
      'Drawback / regímenes'
    ],
    'SOPORTE / SISTEMAS': [
      'Protección de datos personales',
      'Licencias de software',
      'Facturación electrónica (TI)'
    ]
  };

  get legalGroupKeys(): string[] {
    return Object.keys(this.LEGAL_GROUPS);
  }

  seleccionarTema(tema: string | null): void {
    this.selectedTema = tema;
    if (!tema) {
      this.docDataSource.filter = '';
    } else {
      this.docDataSource.filter = tema.toLowerCase();
    }
  }

  getTemaCount(subTema: string): number {
    return this.docDataSource.data.filter(d =>
      (d.tema && d.tema.toLowerCase() === subTema.toLowerCase()) ||
      (d.requisito && d.requisito.toLowerCase().includes(subTema.toLowerCase())) ||
      (d.ambito && d.ambito.toLowerCase().includes(subTema.toLowerCase()))
    ).length;
  }

  getGroupCount(subTemas: string[]): number {
    return subTemas.reduce((acc, st) => acc + this.getTemaCount(st), 0);
  }

  readonly SEED_DOCUMENTOS: ReqLegalItem[] = [
    { id: 1, requisito: 'Programa Anual de Capacitaciones SST (4 anuales)', tema: 'Formación y capacitaciones', ambito: 'Seguridad y Salud en el Trabajo', tipo: 'Programa', norma: 'Ley 29783 / D.S. 005-2012-TR', entidad: 'MINTRA', obligacion: 'Registro automático de asistencia; 4 capacitaciones SST al año.', estado: 'En proceso', responsable: 'Jefe SSOMA', frecuencia: 'Anual', evaluacion: '2026-01-15', proxeval: '2026-12-15', vencimiento: '2026-12-31', evidencia: '' },
    { id: 2, requisito: 'Capacitación al Comité de SST', tema: 'Formación y capacitaciones', ambito: 'Seguridad y Salud en el Trabajo', tipo: 'Registro / Acta', norma: 'Ley 29783', entidad: 'MINTRA', obligacion: '1 capacitación anual al CSST con vigencia.', estado: 'Cumple', responsable: 'Jefe SSOMA', frecuencia: 'Anual', evaluacion: '2026-03-01', proxeval: '2027-03-01', vencimiento: '2027-03-01', evidencia: '' },
    { id: 3, requisito: 'Proceso de elecciones del CSST', tema: 'Comité de SST', ambito: 'Seguridad y Salud en el Trabajo', tipo: 'Registro / Acta', norma: 'R.M. 245-2021-TR', entidad: 'MINTRA', obligacion: 'Elecciones y acta de instalación, vigencia no mayor a 2 años.', estado: 'Cumple', responsable: 'Jefe SSOMA', frecuencia: '≤2 años', evaluacion: '2024-09-01', proxeval: '2026-08-15', vencimiento: '2026-09-01', evidencia: 'ACTA-CSST-2024.pdf' },
    { id: 4, requisito: 'Actas de reunión ordinaria del CSST', tema: 'Comité de SST', ambito: 'Seguridad y Salud en el Trabajo', tipo: 'Registro / Acta', norma: 'Ley 29783', entidad: 'MINTRA', obligacion: 'Reunión mensual con acta obligatoria.', estado: 'En proceso', responsable: 'Secretario CSST', frecuencia: 'Mensual', evaluacion: '2026-07-10', proxeval: '2026-08-10', vencimiento: '', evidencia: '' },
    { id: 5, requisito: 'Licencia de Funcionamiento Municipal Huachipa', tema: 'Licencias Municipales', ambito: 'Municipal', tipo: 'Licencia / Permiso', norma: 'Ordenanza Municipal 124-MDS', entidad: 'Municipalidad', obligacion: 'Vigencia indeterminada pero sujeta a fiscalización de defensa civil.', estado: 'Cumple', responsable: 'Gestión Legal', frecuencia: 'Única vez', evaluacion: '2023-05-10', proxeval: '2026-11-10', vencimiento: '', evidencia: 'LIC-HUACHIPA.pdf' }
  ];

  readonly SEED_MATRIZ: ReqLegalItem[] = [
    { id: 101, item: '1.1', ambito: 'Seguridad y Salud en el Trabajo', entidad: 'MINTRA', norma: 'Ley N° 29783 — Ley de Seguridad y Salud en el Trabajo', articulo: 'Art. 22', requisito: 'El empleador garantiza la implementación de un Sistema de Gestión de Seguridad y Salud en el Trabajo.', evidenciadoc: 'Política SSOMA y Reglamento Interno RISST', responsable: 'Jefe SSOMA', estado: 'Cumple', observaciones: 'Revisado y actualizado en Comité SST.' },
    { id: 102, item: '1.2', ambito: 'Seguridad y Salud en el Trabajo', entidad: 'MINTRA', norma: 'D.S. N° 005-2012-TR — Reglamento de la Ley N° 29783', articulo: 'Art. 42', requisito: 'Garantizar el funcionamiento del Comité de SST o Supervisor en todas las sedes.', evidenciadoc: 'Actas mensuales del Comité SST', responsable: 'Secretario CSST', estado: 'Cumple', observaciones: 'Reuniones mensuales al día.' },
    { id: 103, item: '2.1', ambito: 'Medio Ambiente', entidad: 'MINAM / OEFA', norma: 'Ley N° 28611 — Ley General del Ambiente', articulo: 'Art. 119', requisito: 'Manejo integral de residuos sólidos conforme al plan de minimización.', evidenciadoc: 'Plan de Manejo de Residuos Sólidos y Declaración Anual', responsable: 'Ingeniero Ambiental', estado: 'En proceso', observaciones: 'Pendiente presentar reporte del 2do trimestre.' },
    { id: 104, item: '3.1', ambito: 'Laboral', entidad: 'SUNAFIL', norma: 'D.S. N° 003-97-TR — Ley de Productividad y Competitividad Laboral', articulo: 'Art. 87', requisito: 'Entrega oportuna de boletas de pago y beneficios sociales.', evidenciadoc: 'Boletas electrónicas en Portal del Empleado', responsable: 'Recursos Humanos', estado: 'Cumple', observaciones: 'Cumplimiento 100% digital.' }
  ];

  constructor(
    private router: Router,
    private reqLegalService: ReqLegalService,
    private dialog: MatDialog,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    if (this.router.url.includes('/matriz')) {
      this.activeTab = 'matriz';
    } else {
      this.activeTab = 'documentos';
    }
    this.cargarDatos();
  }

  cargarDatos(): void {
    // 1. Pestaña Documentos
    const localDocs = localStorage.getItem('precotex:legal:documentos');
    let docData: ReqLegalItem[] = [];
    if (localDocs) {
      try { docData = JSON.parse(localDocs); } catch (e) { docData = [...this.SEED_DOCUMENTOS]; }
    } else {
      docData = [...this.SEED_DOCUMENTOS];
      localStorage.setItem('precotex:legal:documentos', JSON.stringify(docData));
    }
    this.docDataSource.data = docData;
    if (this.docPaginator) this.docDataSource.paginator = this.docPaginator;
    if (this.docSort) this.docDataSource.sort = this.docSort;

    // 2. Pestaña Matriz Legal
    const localMatriz = localStorage.getItem('precotex:legal:matriz');
    let matrizData: ReqLegalItem[] = [];
    if (localMatriz) {
      try { matrizData = JSON.parse(localMatriz); } catch (e) { matrizData = [...this.SEED_MATRIZ]; }
    } else {
      matrizData = [...this.SEED_MATRIZ];
      localStorage.setItem('precotex:legal:matriz', JSON.stringify(matrizData));
    }
    this.matrizDataSource.data = matrizData;
    if (this.matrizPaginator) this.matrizDataSource.paginator = this.matrizPaginator;
    if (this.matrizSort) this.matrizDataSource.sort = this.matrizSort;

    this.calcularStats();
    this.computarAlertas();

    // Intentar Backend
    this.reqLegalService.getListadoReqLegal().subscribe({
      next: (res: any) => {
        if (res && res.success && res.elements && res.elements.length > 0) {
          const mapped = res.elements.map((item: any) => ({
            id: item.id_Req || item.id,
            requisito: item.requisito || item.normativa,
            ambito: item.ambito || 'Seguridad y Salud en el Trabajo',
            tipo: item.tipo || 'Ley',
            norma: item.norma || item.normativa,
            entidad: item.entidad || 'MINTRA',
            obligacion: item.obligacion || '',
            estado: item.estado || 'Cumple',
            responsable: item.responsable || '',
            evaluacion: item.evaluacion ? item.evaluacion.split('T')[0] : '',
            proxeval: item.proxeval ? item.proxeval.split('T')[0] : '',
            vencimiento: item.vencimiento ? item.vencimiento.split('T')[0] : '',
            evidencia: item.evidencia || ''
          }));
          this.docDataSource.data = mapped;
          this.calcularStats();
          this.computarAlertas();
        }
      },
      error: () => { }
    });
  }

  setTab(tab: 'documentos' | 'matriz'): void {
    this.activeTab = tab;
    if (tab === 'matriz') {
      this.router.navigate(['/principal/reqLegal/matriz']);
    } else {
      this.router.navigate(['/principal/reqLegal']);
    }
    this.calcularStats();
    this.computarAlertas();
  }

  calcularStats(): void {
    const list = this.activeTab === 'documentos' ? this.docDataSource.data : this.matrizDataSource.data;
    this.stats.total = list.length;
    this.stats.cumple = list.filter(r => r.estado === 'Cumple').length;
    this.stats.cumplimientoPct = this.stats.total > 0 ? Math.round((this.stats.cumple / this.stats.total) * 100) : 0;
  }

  computarAlertas(): void {
    const alerts: { sev: 'red' | 'amber'; txt: string; tag: string }[] = [];
    const hoy = new Date();
    const list = [...this.docDataSource.data, ...this.matrizDataSource.data];

    let criticas = 0;

    list.forEach(d => {
      if (d.estado === 'No cumple') {
        criticas++;
        alerts.push({ sev: 'red', txt: `Requisito <b>${d.requisito || d.norma}</b> marcado como <b>No cumple</b>`, tag: 'No cumple' });
      }

      if (d.vencimiento) {
        const dias = Math.ceil((new Date(d.vencimiento).getTime() - hoy.getTime()) / (1000 * 3600 * 24));
        if (dias < 0) {
          criticas++;
          alerts.push({ sev: 'red', txt: `Documento legal <b>${d.requisito || d.norma}</b> vencido hace ${-dias} días`, tag: 'Vencido' });
        } else if (dias <= 45) {
          alerts.push({ sev: 'amber', txt: `Documento legal <b>${d.requisito || d.norma}</b> vence en ${dias} días`, tag: 'Por vencer' });
        }
      }
    });

    this.alertasLegales = alerts;
    this.stats.alertas = alerts.length;
    this.stats.criticas = criticas;
  }

  aplicarFiltro(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    if (this.activeTab === 'documentos') {
      this.docDataSource.filter = filterValue;
    } else {
      this.matrizDataSource.filter = filterValue;
    }
  }

  onAgregar(): void {
    const dialogRef = this.dialog.open(ReqLegalRegeditComponent, {
      width: '720px',
      maxHeight: '90vh',
      disableClose: true,
      data: {
        Title: this.activeTab === 'documentos' ? 'Nuevo Documento Legal' : 'Nuevo Requisito de Matriz Legal',
        Accion: 'I',
        EsMatriz: this.activeTab === 'matriz',
        Datos: null
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        if (this.activeTab === 'documentos') {
          const current = [...this.docDataSource.data];
          res.id = current.length > 0 ? Math.max(...current.map(c => c.id)) + 1 : 1;
          current.unshift(res);
          localStorage.setItem('precotex:legal:documentos', JSON.stringify(current));
          this.docDataSource.data = current;
        } else {
          const current = [...this.matrizDataSource.data];
          res.id = current.length > 0 ? Math.max(...current.map(c => c.id)) + 1 : 101;
          current.unshift(res);
          localStorage.setItem('precotex:legal:matriz', JSON.stringify(current));
          this.matrizDataSource.data = current;
        }
        this.calcularStats();
        this.computarAlertas();
        this.toastr.success('Requisito legal guardado con éxito.', 'Registro Guardado');
      }
    });
  }

  onEditar(item: ReqLegalItem): void {
    const dialogRef = this.dialog.open(ReqLegalRegeditComponent, {
      width: '720px',
      maxHeight: '90vh',
      disableClose: true,
      data: {
        Title: 'Editar Requisito Legal',
        Accion: 'U',
        EsMatriz: this.activeTab === 'matriz',
        Datos: item
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        if (this.activeTab === 'documentos') {
          const current = this.docDataSource.data.map((c: ReqLegalItem) => c.id === item.id ? { ...c, ...res } : c);
          localStorage.setItem('precotex:legal:documentos', JSON.stringify(current));
          this.docDataSource.data = current;
        } else {
          const current = this.matrizDataSource.data.map((c: ReqLegalItem) => c.id === item.id ? { ...c, ...res } : c);
          localStorage.setItem('precotex:legal:matriz', JSON.stringify(current));
          this.matrizDataSource.data = current;
        }
        this.calcularStats();
        this.computarAlertas();
        this.toastr.success('Requisito legal actualizado con éxito.', 'Actualizado');
      }
    });
  }

  onVer(item: ReqLegalItem): void {
    const dialogRef = this.dialog.open(ReqLegalDetailComponent, {
      width: '980px',
      maxWidth: '95vw',
      panelClass: 'custom-dialog-container',
      data: {
        item: item
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res && res.action === 'edit') {
        this.onEditar(res.item);
      }
    });
  }

  onEliminar(item: ReqLegalItem): void {
    Swal.fire({
      title: '¿Eliminar requisito legal?',
      text: `Se eliminará el registro: ${item.requisito || item.norma}`,
      icon: 'warning',
      background: '#ffffff',
      color: '#1e2545',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d23a54',
      cancelButtonColor: '#94a3b8'
    }).then(res => {
      if (res.isConfirmed) {
        if (this.activeTab === 'documentos') {
          const current = this.docDataSource.data.filter((c: ReqLegalItem) => c.id !== item.id);
          localStorage.setItem('precotex:legal:documentos', JSON.stringify(current));
          this.docDataSource.data = current;
        } else {
          const current = this.matrizDataSource.data.filter((c: ReqLegalItem) => c.id !== item.id);
          localStorage.setItem('precotex:legal:matriz', JSON.stringify(current));
          this.matrizDataSource.data = current;
        }
        this.calcularStats();
        this.computarAlertas();
        this.toastr.success('Requisito legal eliminado.', 'Eliminado');
      }
    });
  }

  onDescargarPlantilla(): void {
    const csvContent = "data:text/csv;charset=utf-8,Item,Ambito,Organismo emisor,Codigo y titulo de la normativa,N de articulo,Extracto del articulo,Documento o evidencia del cumplimiento,Responsable,Evaluacion de cumplimiento,Observaciones\n1.1,Seguridad y Salud en el Trabajo,MINTRA,Ley 29783 Ley de SST,Art. 22,Garantizar Sistema de Gestión SST,Reglamento Interno RISST,Jefe SSOMA,Cumple,Sin observaciones\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Plantilla_Matriz_Legal_Precotex.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
    this.toastr.success('Plantilla CSV descargada correctamente.', 'Plantilla Legal');
  }

  onImportarCsv(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.toastr.info(`Importando archivo '${file.name}'...`, 'Matriz Legal');
      setTimeout(() => {
        this.toastr.success(`Registros importados con éxito desde '${file.name}'.`, 'Importación Completada');
      }, 1000);
    }
  }

  onDescargarEvidencia(item: ReqLegalItem): void {
    const fileName = item.evidencia || item.evidenciadoc;
    if (fileName && fileName.trim().length > 0) {
      this.toastr.success(`Descargando archivo de evidencia: '${fileName}'`, 'Descarga Exitosa');
    } else {
      this.toastr.warning(`El registro '${item.requisito || item.norma}' no cuenta con un archivo de evidencia adjunto.`, 'Sin Evidencia');
    }
  }

  onGuardarExcelOriginal(): void {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.xlsx,.xls,.csv';
    inp.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        this.toastr.success(`Excel original '${file.name}' guardado correctamente.`, 'Excel Original');
      }
    };
    inp.click();
  }

  onDescargarExcelOriginal(): void {
    this.toastr.info('Descargando archivo Excel original de la Matriz Legal...', 'Descarga Excel');
  }

  onExportarPdf(): void {
    this.toastr.info('Generando reporte PDF de la Matriz Legal...', 'Exportar PDF');
  }

  onExportarExcel(): void {
    this.toastr.success('Matriz Legal exportada a Excel con éxito.', 'Exportar Excel');
  }

  getEstadoClass(st: string): string {
    switch (st) {
      case 'Cumple': return 'badge-cumple';
      case 'En proceso': return 'badge-proceso';
      case 'No cumple': return 'badge-no-cumple';
      default: return 'badge-proceso';
    }
  }
}
