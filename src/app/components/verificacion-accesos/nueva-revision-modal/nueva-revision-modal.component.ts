import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';

export interface UsuarioRevision {
  usuario: string;
  puesto: string;
  estado: 'Activo' | 'Desactivado';
  alta: string;
  baja: string;
  ultimoAcceso: string;
  desactivar: boolean;
}

@Component({
  selector: 'app-nueva-revision-modal',
  standalone: false,
  templateUrl: './nueva-revision-modal.component.html',
  styleUrls: ['./nueva-revision-modal.component.css']
})
export class NuevaRevisionModalComponent implements OnInit {

  usuarios: UsuarioRevision[] = [
    {
      usuario: '',
      puesto: 'PUESTO SIN ASIGNAR',
      estado: 'Desactivado',
      alta: '',
      baja: '2024-02-13 05:43:44',
      ultimoAcceso: '',
      desactivar: false
    },
    {
      usuario: '',
      puesto: 'PUESTO SIN ASIGNAR',
      estado: 'Desactivado',
      alta: '',
      baja: '2024-02-13 05:43:49',
      ultimoAcceso: '',
      desactivar: false
    },
    {
      usuario: 'Alan Torres',
      puesto: 'Analista de certificaciones',
      estado: 'Desactivado',
      alta: '2025-09-30 11:01:59',
      baja: '2025-09-30 12:45:34',
      ultimoAcceso: '',
      desactivar: false
    },
    {
      usuario: 'Alan Torres',
      puesto: 'Jefe de Exportaciones',
      estado: 'Activo',
      alta: '2025-09-30 12:46:13',
      baja: '',
      ultimoAcceso: '2026-03-03 07:31:53',
      desactivar: false
    },
    {
      usuario: 'Ricardo Diaz',
      puesto: 'Gerente DDP, Manufactura y Gestión Comercial',
      estado: 'Activo',
      alta: '2025-09-30 09:38:19',
      baja: '',
      ultimoAcceso: '',
      desactivar: false
    },
    {
      usuario: 'Ricardo Muñante',
      puesto: 'JEFE DE PLANEAMIENTO Y CONTROL DE LA PRODUCCIÓN',
      estado: 'Activo',
      alta: '2024-02-28 00:43:28',
      baja: '',
      ultimoAcceso: '',
      desactivar: false
    },
    {
      usuario: 'Rodolfo Gerstein',
      puesto: 'Gerente de Gestión Humana',
      estado: 'Activo',
      alta: '2024-02-21 06:56:27',
      baja: '',
      ultimoAcceso: '',
      desactivar: false
    },
    {
      usuario: 'Rommel Solis',
      puesto: 'Gerente Adjunto',
      estado: 'Activo',
      alta: '2024-02-20 03:14:25',
      baja: '',
      ultimoAcceso: '2026-03-02 11:58:04',
      desactivar: false
    },
    {
      usuario: 'RONY GUSTAVO VILLALVA VELARDE',
      puesto: 'PUESTO SIN ASIGNAR',
      estado: 'Activo',
      alta: '',
      baja: '',
      ultimoAcceso: '',
      desactivar: false
    },
    {
      usuario: 'ROSARIO VELA ALVARADO',
      puesto: 'PUESTO SIN ASIGNAR',
      estado: 'Activo',
      alta: '',
      baja: '',
      ultimoAcceso: '',
      desactivar: false
    },
    {
      usuario: 'Sayda Huaranga',
      puesto: 'Acabado e inspección',
      estado: 'Activo',
      alta: '2026-01-08 10:17:29',
      baja: '',
      ultimoAcceso: '2026-01-22 12:00:07',
      desactivar: false
    },
    {
      usuario: 'Susan Pastrana',
      puesto: '',
      estado: 'Desactivado',
      alta: '2024-02-21 06:59:19',
      baja: '2025-09-30 09:28:38',
      ultimoAcceso: '',
      desactivar: false
    },
    {
      usuario: 'Teresa Villalva',
      puesto: 'Gerencia de Auditoria Interna',
      estado: 'Activo',
      alta: '2025-10-01 05:07:25',
      baja: '',
      ultimoAcceso: '',
      desactivar: false
    },
    {
      usuario: 'Vanesa Arriaga',
      puesto: 'Asistente de Costura',
      estado: 'Activo',
      alta: '2025-10-11 11:49:33',
      baja: '',
      ultimoAcceso: '2026-03-03 18:37:21',
      desactivar: false
    },
    {
      usuario: 'William Villalva',
      puesto: 'Gerente de Soporte',
      estado: 'Activo',
      alta: '',
      baja: '',
      ultimoAcceso: '',
      desactivar: false
    }
  ];

  constructor(
    public dialogRef: MatDialogRef<NuevaRevisionModalComponent>,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {}

  onCerrar(): void {
    this.dialogRef.close(null);
  }

  onRealizarRevision(): void {
    // Count how many users are marked to be deactivated
    const totalDeactivados = this.usuarios.filter(u => u.desactivar).length;

    this.toastr.success(
      `Se ha realizado la revisión. ${totalDeactivados} usuario(s) desactivado(s).`,
      'Revisión Completada'
    );

    this.dialogRef.close({
      desactivados: totalDeactivados
    });
  }

  toggleDesactivar(user: UsuarioRevision): void {
    user.desactivar = !user.desactivar;
  }
}
