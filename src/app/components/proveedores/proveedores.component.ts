import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

import { ProveedoresService } from '../../services/proveedores.service';
import { ProveedoresRegeditComponent } from './proveedores-regedit/proveedores-regedit.component';

export interface Proveedor {
  id: number;
  razon: string;
  ruc: string;
  tipo: string;
  proceso: string;
  contacto?: string;
  homologacion: string;
  desempeno?: string;
  evaluacion?: string;
  reeval?: string;
  sctr?: string;
  induccion?: string;
  iperc?: string;
  seguro?: string;
}

@Component({
  selector: 'app-proveedores',
  standalone: false,
  templateUrl: './proveedores.component.html',
  styleUrl: './proveedores.component.css'
})
export class ProveedoresComponent implements OnInit {

  displayedColumns: string[] = ['razon', 'ruc', 'tipo', 'proceso', 'homologacion', 'desempeno', 'reeval', 'acciones'];
  dataSource = new MatTableDataSource<Proveedor>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  stats = {
    total: 0,
    homologados: 0,
    enEvaluacion: 0,
    alertas: 0
  };

  alertasProv: { sev: 'red' | 'amber'; txt: string; tag: string }[] = [];

  readonly SEED_DATA: Proveedor[] = [
    { id: 1, razon: 'Textiles Andinos S.A.C.', ruc: '20481234567', tipo: 'Bien', proceso: 'Almacén', contacto: 'ventas@textilesandinos.pe', homologacion: 'Homologado', desempeno: 'Bueno', evaluacion: '2025-09-01', reeval: '2026-09-01', sctr: '', induccion: '', iperc: '', seguro: '' },
    { id: 2, razon: 'Servicios de Limpieza Lima E.I.R.L.', ruc: '20567891234', tipo: 'Servicio', proceso: 'Costura', contacto: 'contacto@limpiezalima.pe', homologacion: 'En evaluación', desempeno: 'Regular', evaluacion: '2025-07-10', reeval: '2026-08-10', sctr: '', induccion: '', iperc: '', seguro: '' },
    { id: 3, razon: 'Constructora ByC S.A.C.', ruc: '20601122334', tipo: 'Contratista', proceso: 'SSOMA', contacto: 'obras@byc.pe', homologacion: 'Homologado', desempeno: 'Bueno', evaluacion: '2025-07-30', reeval: '2026-07-30', sctr: '2026-07-25', induccion: '2026-08-15', iperc: '2026-06-15', seguro: '2027-01-10' },
    { id: 4, razon: 'Transportes RápidoSur', ruc: '20489988776', tipo: 'Servicio', proceso: 'Transporte', contacto: 'logistica@rapidosur.pe', homologacion: 'Observado', desempeno: 'Deficiente', evaluacion: '2025-05-15', reeval: '2026-05-15', sctr: '', induccion: '', iperc: '', seguro: '' },
    { id: 5, razon: 'Mantenimiento Eléctrico S.R.L.', ruc: '20455566778', tipo: 'Contratista', proceso: 'Mantenimiento General', contacto: 'servicio@manelectrico.pe', homologacion: 'No apto', desempeno: 'Deficiente', evaluacion: '2025-06-01', reeval: '2026-06-01', sctr: '2026-06-01', induccion: '2026-09-01', iperc: '2026-08-20', seguro: '2026-12-01' }
  ];

  constructor(
    private proveedoresService: ProveedoresService,
    private dialog: MatDialog,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    const local = localStorage.getItem('precotex:proveedores');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        this.actualizarTabla(parsed);
      } catch (e) {
        this.actualizarTabla(this.SEED_DATA);
      }
    } else {
      localStorage.setItem('precotex:proveedores', JSON.stringify(this.SEED_DATA));
      this.actualizarTabla(this.SEED_DATA);
    }

    // Intentar servicio backend si está disponible
    this.proveedoresService.getListadoProveedores().subscribe({
      next: (res: any) => {
        if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          this.actualizarTabla(res.data);
          localStorage.setItem('precotex:proveedores', JSON.stringify(res.data));
        }
      },
      error: () => {
        // Silencioso: mantener datos locales
      }
    });
  }

  actualizarTabla(data: Proveedor[]): void {
    this.dataSource.data = data;
    if (this.paginator) this.dataSource.paginator = this.paginator;
    if (this.sort) this.dataSource.sort = this.sort;
    this.calcularStats(data);
    this.computarAlertas(data);
  }

  calcularStats(rows: Proveedor[]): void {
    this.stats.total = rows.length;
    this.stats.homologados = rows.filter(r => r.homologacion === 'Homologado').length;
    this.stats.enEvaluacion = rows.filter(r => r.homologacion === 'En evaluación').length;
  }

  computarAlertas(rows: Proveedor[]): void {
    const alerts: { sev: 'red' | 'amber'; txt: string; tag: string }[] = [];
    const hoy = new Date();

    rows.forEach(d => {
      if (d.homologacion === 'No apto') {
        alerts.push({ sev: 'red', txt: `Proveedor <b>${d.razon}</b> marcado como <b>No apto</b>`, tag: 'No apto' });
      } else if (d.homologacion === 'Observado') {
        alerts.push({ sev: 'amber', txt: `Proveedor <b>${d.razon}</b> está <b>Observado</b>`, tag: 'Observado' });
      }

      if (d.reeval) {
        const dias = Math.ceil((new Date(d.reeval).getTime() - hoy.getTime()) / (1000 * 3600 * 24));
        if (dias < 0) {
          alerts.push({ sev: 'red', txt: `Re-evaluación de <b>${d.razon}</b> vencida hace ${-dias} días`, tag: 'Re-evaluar' });
        } else if (dias <= 45) {
          alerts.push({ sev: 'amber', txt: `Re-evaluación de <b>${d.razon}</b> vence en ${dias} días`, tag: 'Re-evaluar' });
        }
      }

      if (d.tipo === 'Contratista') {
        const docList: { key: keyof Proveedor; label: string }[] = [
          { key: 'sctr', label: 'SCTR' },
          { key: 'induccion', label: 'Inducción SST' },
          { key: 'iperc', label: 'IPERC' },
          { key: 'seguro', label: 'Póliza/Seguro' }
        ];

        docList.forEach(doc => {
          const fechaVal = d[doc.key] as string;
          if (fechaVal) {
            const diasSst = Math.ceil((new Date(fechaVal).getTime() - hoy.getTime()) / (1000 * 3600 * 24));
            if (diasSst < 0) {
              alerts.push({ sev: 'red', txt: `${doc.label} de <b>${d.razon}</b> vencido hace ${-diasSst} días`, tag: doc.label });
            } else if (diasSst <= 30) {
              alerts.push({ sev: 'amber', txt: `${doc.label} de <b>${d.razon}</b> vence en ${diasSst} días`, tag: doc.label });
            }
          }
        });
      }
    });

    this.alertasProv = alerts;
    this.stats.alertas = alerts.length;
  }

  aplicarFiltro(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  onAgregar(): void {
    const dialogRef = this.dialog.open(ProveedoresRegeditComponent, {
      width: '720px',
      maxHeight: '90vh',
      disableClose: true,
      data: {
        Title: 'Nuevo Proveedor o Contratista',
        Accion: 'I',
        Datos: null
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        const current = [...this.dataSource.data];
        res.id = current.length > 0 ? Math.max(...current.map(c => c.id)) + 1 : 1;
        current.unshift(res);

        // Guardar en localStorage
        localStorage.setItem('precotex:proveedores', JSON.stringify(current));
        this.actualizarTabla(current);

        // Intentar guardar en backend
        this.proveedoresService.postProveedorMnto({ Accion: 'I', ...res }).subscribe({
          next: () => this.toastr.success('Proveedor registrado en servidor.', 'Éxito'),
          error: () => this.toastr.success('Proveedor registrado localmente.', 'Éxito')
        });
      }
    });
  }

  onEditar(item: Proveedor): void {
    const dialogRef = this.dialog.open(ProveedoresRegeditComponent, {
      width: '720px',
      maxHeight: '90vh',
      disableClose: true,
      data: {
        Title: 'Editar Proveedor / Contratista',
        Accion: 'U',
        Datos: item
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        const current = this.dataSource.data.map(c => c.id === item.id ? { ...c, ...res } : c);
        localStorage.setItem('precotex:proveedores', JSON.stringify(current));
        this.actualizarTabla(current);

        this.proveedoresService.postProveedorMnto({ Accion: 'U', ...res }).subscribe({
          next: () => this.toastr.success('Proveedor actualizado en servidor.', 'Actualizado'),
          error: () => this.toastr.success('Proveedor actualizado localmente.', 'Actualizado')
        });
      }
    });
  }

  onVer(item: Proveedor): void {
    Swal.fire({
      title: `🏢 ${item.razon}`,
      background: '#ffffff',
      color: '#1e2545',
      width: '640px',
      html: `
        <div style="text-align: left; font-size: 13px; color: #1e2545; line-height: 1.6; font-family: var(--sn-font-family);">
          <div style="background: #f4f6fc; border: 1px solid #e2e7f1; border-radius: 10px; padding: 14px; margin-bottom: 14px;">
            <div style="font-weight: 700; color: #5b4bd6; font-size: 15px; margin-bottom: 4px;">RUC: ${item.ruc} — ${item.tipo}</div>
            <div><strong style="color:#5a6178;">Proceso / Área Requiriente:</strong> ${item.proceso}</div>
            <div><strong style="color:#5a6178;">Contacto:</strong> ${item.contacto || '—'}</div>
            <div><strong style="color:#5a6178;">Estado de Homologación:</strong> <span style="font-weight: 700; color: #5b4bd6;">${item.homologacion}</span></div>
            <div><strong style="color:#5a6178;">Desempeño Operativo:</strong> ${item.desempeno || '—'}</div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
            <div style="background: #ffffff; border: 1px solid #e2e7f1; padding: 10px 12px; border-radius: 8px;">
              <strong style="color: #5a6178; font-size: 11px; text-transform: uppercase; display: block;">Última Evaluación</strong>
              <span style="font-weight: 600; font-size: 13px;">${item.evaluacion || '—'}</span>
            </div>
            <div style="background: #ffffff; border: 1px solid #e2e7f1; padding: 10px 12px; border-radius: 8px;">
              <strong style="color: #5a6178; font-size: 11px; text-transform: uppercase; display: block;">Próxima Re-evaluación</strong>
              <span style="font-weight: 600; font-size: 13px; color: #b8790a;">${item.reeval || '—'}</span>
            </div>
          </div>

          ${item.tipo === 'Contratista' ? `
            <div style="background: rgba(22, 163, 74, 0.06); border: 1px solid rgba(22, 163, 74, 0.2); padding: 12px; border-radius: 10px; margin-top: 10px;">
              <strong style="color: #16a34a; font-size: 11px; text-transform: uppercase; display: block; margin-bottom: 8px;">🛡️ Cumplimiento SST (Contratista)</strong>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
                <div><strong>SCTR:</strong> ${item.sctr || '—'}</div>
                <div><strong>Inducción SST:</strong> ${item.induccion || '—'}</div>
                <div><strong>IPERC:</strong> ${item.iperc || '—'}</div>
                <div><strong>Seguro/Póliza:</strong> ${item.seguro || '—'}</div>
              </div>
            </div>
          ` : ''}
        </div>
      `,
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#5b4bd6'
    });
  }

  onEliminar(item: Proveedor): void {
    Swal.fire({
      title: '¿Eliminar proveedor?',
      text: `Se eliminará el registro: ${item.razon}`,
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
        const current = this.dataSource.data.filter(c => c.id !== item.id);
        localStorage.setItem('precotex:proveedores', JSON.stringify(current));
        this.actualizarTabla(current);

        this.proveedoresService.postProveedorMnto({ Accion: 'D', id: item.id }).subscribe({
          next: () => this.toastr.success('Proveedor eliminado.', 'Eliminado'),
          error: () => this.toastr.success('Proveedor eliminado localmente.', 'Eliminado')
        });
      }
    });
  }

  getHomologacionClass(h: string): string {
    switch (h) {
      case 'Homologado': return 'badge-homologado';
      case 'En evaluación': return 'badge-evaluacion';
      case 'Observado': return 'badge-observado';
      case 'No apto': return 'badge-no-apto';
      default: return 'badge-evaluacion';
    }
  }
}
