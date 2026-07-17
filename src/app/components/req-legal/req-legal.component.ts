import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { ReqLegalRegeditComponent } from './req-legal-regedit/req-legal-regedit.component';

@Component({
  selector: 'app-req-legal',
  standalone: false,
  templateUrl: './req-legal.component.html',
  styleUrls: ['./req-legal.component.css']
})
export class ReqLegalComponent implements OnInit {
  legalList: any[] = [];
  searchText: string = '';

  stats = {
    total: 0,
    cumple: 0,
    enProceso: 0,
    noCumple: 0
  };

  displayedColumns: string[] = [
    'requisito',
    'ambito',
    'entidad',
    'norma',
    'proxeval',
    'vencimiento',
    'estado',
    'acciones'
  ];
  dataSource = new MatTableDataSource<any>();

  constructor(
    private dialog: MatDialog,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.onListado();
  }

  onListado() {
    try {
      const localData = localStorage.getItem('precotex_requisitos_legales');
      if (localData) {
        this.legalList = JSON.parse(localData);
      } else {
        this.legalList = [
          {
            id: 'rl-1',
            requisito: 'Ley 29783 — Seguridad y Salud en el Trabajo',
            ambito: 'Seguridad y salud (SST)',
            tipo: 'Ley',
            norma: 'Ley 29783',
            entidad: 'MINTRA',
            obligacion: 'Implementar el SGSST, comité de SST y reglamento interno.',
            estado: 'Cumple',
            responsable: 'Jefe SSOMA',
            evaluacion: '2025-09-10',
            proxeval: '2026-09-10',
            vencimiento: '',
            evidencia: 'RISST-2025.pdf'
          },
          {
            id: 'rl-2',
            requisito: 'D.S. 005-2012-TR — Reglamento de la Ley SST',
            ambito: 'Seguridad y salud (SST)',
            tipo: 'Decreto Supremo',
            norma: 'D.S. 005-2012-TR',
            entidad: 'MINTRA',
            obligacion: 'Cumplir el reglamento de la Ley de SST.',
            estado: 'Cumple',
            responsable: 'Jefe SSOMA',
            evaluacion: '2025-08-01',
            proxeval: '2026-08-01',
            vencimiento: '',
            evidencia: ''
          },
          {
            id: 'rl-3',
            requisito: 'Autorización de vertimiento de aguas residuales',
            ambito: 'Ambiental',
            tipo: 'Licencia / Permiso',
            norma: 'R.D. ANA',
            entidad: 'ANA',
            obligacion: 'Mantener vigente la autorización de vertimiento industrial.',
            estado: 'En proceso',
            responsable: 'Área Ambiental',
            evaluacion: '2025-07-20',
            proxeval: '',
            vencimiento: '2026-07-25',
            evidencia: 'AUT-ANA-2024.pdf'
          },
          {
            id: 'rl-4',
            requisito: 'Certificado ITSE — Defensa Civil',
            ambito: 'Municipal',
            tipo: 'Licencia / Permiso',
            norma: 'ITSE',
            entidad: 'Municipalidad',
            obligacion: 'Inspección técnica de seguridad en edificaciones vigente por planta.',
            estado: 'Cumple',
            responsable: 'Seguridad Patrimonial',
            evaluacion: '2025-08-20',
            proxeval: '',
            vencimiento: '2026-08-20',
            evidencia: 'CERT-ITSE-2025.pdf'
          },
          {
            id: 'rl-5',
            requisito: 'Licencia de funcionamiento',
            ambito: 'Municipal',
            tipo: 'Licencia / Permiso',
            norma: 'Lic. Func.',
            entidad: 'Municipalidad',
            obligacion: 'Licencia municipal de funcionamiento de la planta.',
            estado: 'Cumple',
            responsable: 'Admin y Finanzas',
            evaluacion: '2025-03-01',
            proxeval: '',
            vencimiento: '2027-03-01',
            evidencia: 'LIC-FUNC-2025.pdf'
          },
          {
            id: 'rl-6',
            requisito: 'D.L. 1278 — Gestión Integral de Residuos Sólidos',
            ambito: 'Ambiental',
            tipo: 'Ley',
            norma: 'D.L. 1278',
            entidad: 'MINAM',
            obligacion: 'Declaración y manejo de residuos sólidos industriales.',
            estado: 'En proceso',
            responsable: 'Área Ambiental',
            evaluacion: '2025-06-20',
            proxeval: '2026-06-20',
            vencimiento: '',
            evidencia: ''
          },
          {
            id: 'rl-7',
            requisito: 'Reglamento de etiquetado de productos textiles',
            ambito: 'Sectorial textil',
            tipo: 'Norma técnica',
            norma: 'D.S. 017-2017-PRODUCE',
            entidad: 'INDECOPI',
            obligacion: 'Etiquetado obligatorio de composición y cuidado de prendas.',
            estado: 'No cumple',
            responsable: 'Calidad',
            evaluacion: '2025-05-15',
            proxeval: '2026-05-15',
            vencimiento: '',
            evidencia: ''
          }
        ];
        localStorage.setItem('precotex_requisitos_legales', JSON.stringify(this.legalList));
      }

      this.calculateStats();
      this.applyFilter();
    } catch (e) {
      this.toastr.error('Error al cargar la información.', '', { timeOut: 2500 });
    }
  }

  calculateStats() {
    this.stats.total = this.legalList.length;
    this.stats.cumple = this.legalList.filter(l => l.estado === 'Cumple').length;
    this.stats.enProceso = this.legalList.filter(l => l.estado === 'En proceso').length;
    this.stats.noCumple = this.legalList.filter(l => l.estado === 'No cumple').length;
  }

  buscar(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.searchText = val;
    this.applyFilter();
  }

  applyFilter() {
    let list = [...this.legalList];

    if (this.searchText.trim()) {
      const q = this.searchText.toLowerCase();
      list = list.filter(l =>
        l.requisito.toLowerCase().includes(q) ||
        l.ambito.toLowerCase().includes(q) ||
        l.entidad.toLowerCase().includes(q) ||
        l.norma.toLowerCase().includes(q) ||
        l.estado.toLowerCase().includes(q)
      );
    }

    this.dataSource.data = list;
  }

  onAgregar() {
    const dialogRef = this.dialog.open(ReqLegalRegeditComponent, {
      width: '650px',
      disableClose: true,
      data: {
        Title: 'Nuevo requisito',
        Accion: 'I',
        Datos: null
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        const newItem = {
          id: 'rl-' + Date.now(),
          requisito: res.requisito.trim(),
          ambito: res.ambito,
          tipo: res.tipo,
          norma: res.norma ? res.norma.trim() : '',
          entidad: res.entidad,
          obligacion: res.obligacion ? res.obligacion.trim() : '',
          estado: res.estado,
          responsable: res.responsable ? res.responsable.trim() : '',
          evaluacion: res.evaluacion,
          proxeval: res.proxeval,
          vencimiento: res.vencimiento,
          evidencia: res.evidencia ? res.evidencia.trim() : ''
        };
        this.legalList.push(newItem);
        localStorage.setItem('precotex_requisitos_legales', JSON.stringify(this.legalList));
        this.onListado();
        this.toastr.success('Requisito registrado correctamente.', '', { timeOut: 2000 });
      }
    });
  }

  onEditar(item: any) {
    const dialogRef = this.dialog.open(ReqLegalRegeditComponent, {
      width: '650px',
      disableClose: true,
      data: {
        Title: 'Editar requisito',
        Accion: 'U',
        Datos: item
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        const idx = this.legalList.findIndex(l => l.id === item.id);
        if (idx !== -1) {
          this.legalList[idx] = {
            ...this.legalList[idx],
            requisito: res.requisito.trim(),
            ambito: res.ambito,
            tipo: res.tipo,
            norma: res.norma ? res.norma.trim() : '',
            entidad: res.entidad,
            obligacion: res.obligacion ? res.obligacion.trim() : '',
            estado: res.estado,
            responsable: res.responsable ? res.responsable.trim() : '',
            evaluacion: res.evaluacion,
            proxeval: res.proxeval,
            vencimiento: res.vencimiento,
            evidencia: res.evidencia ? res.evidencia.trim() : ''
          };
          localStorage.setItem('precotex_requisitos_legales', JSON.stringify(this.legalList));
          this.onListado();
          this.toastr.success('Requisito actualizado correctamente.', '', { timeOut: 2000 });
        }
      }
    });
  }

  onEliminar(item: any) {
    Swal.fire({
      title: '¿Desea eliminar el requisito?, Confirme',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.isConfirmed) {
        try {
          this.legalList = this.legalList.filter(l => l.id !== item.id);
          localStorage.setItem('precotex_requisitos_legales', JSON.stringify(this.legalList));
          this.onListado();
          this.toastr.success('Requisito eliminado correctamente.', '', { timeOut: 2000 });
        } catch (e) {
          this.toastr.error('Error al eliminar el requisito.', '', { timeOut: 2000 });
        }
      }
    });
  }
}
