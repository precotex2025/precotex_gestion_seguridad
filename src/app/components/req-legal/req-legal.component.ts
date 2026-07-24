import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { ReqLegalRegeditComponent } from './req-legal-regedit/req-legal-regedit.component';
import { ReqLegalService } from '../../services/req-legal.service';

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
    private toastr: ToastrService,
    private reqLegalService: ReqLegalService
  ) {}

  ngOnInit(): void {
    this.onListado();
  }

  onListado() {
    this.reqLegalService.getListadoReqLegal().subscribe({
      next: (res: any) => {
        if (res && res.success && res.elements) {
          this.legalList = res.elements.map((item: any) => ({
            id: item.id_Req,
            codigo: item.codigo,
            requisito: item.requisito || item.normativa,
            ambito: item.ambito || 'Seguridad y salud (SST)',
            tipo: item.tipo || 'Ley',
            norma: item.norma || item.normativa,
            entidad: item.entidad || 'MINTRA',
            obligacion: item.obligacion || '',
            estado: item.estado || 'En proceso',
            responsable: item.responsable || 'Jefe SSOMA',
            evaluacion: item.evaluacion ? item.evaluacion.split('T')[0] : '',
            proxeval: item.proxeval ? item.proxeval.split('T')[0] : '',
            vencimiento: item.vencimiento ? item.vencimiento.split('T')[0] : '',
            evidencia: item.evidencia || ''
          }));
        } else {
          this.legalList = [];
        }
        this.calculateStats();
        this.applyFilter();
      },
      error: (err) => {
        console.error('Error al consultar BD de Requisitos Legales:', err);
        this.toastr.error('Error al cargar datos desde la base de datos.', 'Error BD');
        this.legalList = [];
        this.calculateStats();
        this.applyFilter();
      }
    });
  }

  calculateStats() {
    this.stats.total = this.legalList.length;
    this.stats.cumple = this.legalList.filter(l => (l.estado || '').toLowerCase() === 'cumple').length;
    this.stats.enProceso = this.legalList.filter(l => (l.estado || '').toLowerCase() === 'en proceso').length;
    this.stats.noCumple = this.legalList.filter(l => (l.estado || '').toLowerCase() === 'no cumple').length;
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
        (l.requisito || '').toLowerCase().includes(q) ||
        (l.ambito || '').toLowerCase().includes(q) ||
        (l.entidad || '').toLowerCase().includes(q) ||
        (l.norma || '').toLowerCase().includes(q) ||
        (l.estado || '').toLowerCase().includes(q)
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
        const payload = {
          Accion: 'I',
          Codigo: '',
          Requisito: res.requisito.trim(),
          Ambito: res.ambito,
          Tipo: res.tipo,
          Norma: res.norma ? res.norma.trim() : '',
          Entidad: res.entidad,
          Obligacion: res.obligacion ? res.obligacion.trim() : '',
          Estado: res.estado,
          Responsable: res.responsable ? res.responsable.trim() : 'Jefe SSOMA',
          Evaluacion: res.evaluacion || null,
          Proxeval: res.proxeval || null,
          Vencimiento: res.vencimiento || null,
          Evidencia: res.evidencia ? res.evidencia.trim() : '',
          Usuario_Registro: 'SISTEMAS'
        };

        this.reqLegalService.postReqLegalMnto(payload).subscribe({
          next: (apiRes: any) => {
            if (apiRes && apiRes.success) {
              this.toastr.success('Requisito legal registrado y guardado en BD.', 'Registrado');
              this.onListado();
            } else {
              this.toastr.error(apiRes?.message || 'Error al guardar el requisito.', 'Error BD');
            }
          },
          error: (err) => {
            this.toastr.error(err.error?.message || err.message, 'Error Servidor');
          }
        });
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
        const payload = {
          Accion: 'U',
          Codigo: item.codigo,
          Requisito: res.requisito.trim(),
          Ambito: res.ambito,
          Tipo: res.tipo,
          Norma: res.norma ? res.norma.trim() : '',
          Entidad: res.entidad,
          Obligacion: res.obligacion ? res.obligacion.trim() : '',
          Estado: res.estado,
          Responsable: res.responsable ? res.responsable.trim() : 'Jefe SSOMA',
          Evaluacion: res.evaluacion || null,
          Proxeval: res.proxeval || null,
          Vencimiento: res.vencimiento || null,
          Evidencia: res.evidencia ? res.evidencia.trim() : '',
          Usuario_Registro: 'SISTEMAS'
        };

        this.reqLegalService.postReqLegalMnto(payload).subscribe({
          next: (apiRes: any) => {
            if (apiRes && apiRes.success) {
              this.toastr.success('Requisito legal actualizado en BD.', 'Actualizado');
              this.onListado();
            } else {
              this.toastr.error(apiRes?.message || 'Error al actualizar el requisito.', 'Error BD');
            }
          },
          error: (err) => {
            this.toastr.error(err.error?.message || err.message, 'Error Servidor');
          }
        });
      }
    });
  }

  onEliminar(item: any) {
    Swal.fire({
      title: `¿Desea eliminar el requisito legal "${item.requisito}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const payload = {
          Accion: 'D',
          Codigo: item.codigo,
          Usuario_Registro: 'SISTEMAS'
        };

        this.reqLegalService.postReqLegalMnto(payload).subscribe({
          next: (apiRes: any) => {
            if (apiRes && apiRes.success) {
              this.toastr.warning('Requisito legal eliminado de BD.', 'Eliminado');
              this.onListado();
            } else {
              this.toastr.error(apiRes?.message || 'Error al eliminar.', 'Error BD');
            }
          },
          error: (err) => {
            this.toastr.error(err.error?.message || err.message, 'Error Servidor');
          }
        });
      }
    });
  }
}
