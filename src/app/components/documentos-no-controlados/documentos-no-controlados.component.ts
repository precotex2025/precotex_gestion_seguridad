import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material/dialog';
import { DocumentosNoControladosRegeditCarpetaComponent } from '../documentos-no-controlados-regedit-carpeta/documentos-no-controlados-regedit-carpeta.component';

@Component({
  selector: 'app-documentos-no-controlados',
  standalone: false,
  templateUrl: './documentos-no-controlados.component.html',
  styleUrl: './documentos-no-controlados.component.css'
})
export class DocumentosNoControladosComponent implements OnInit {
  
  formulario!: FormGroup;
  lstPuestos: any[] = [];
  lstEstados: any[] = [];

  displayedColumns: string[] = [
    'codigo', 
    'ver_ed', 
    'nombre', 
    'estado', 
    'vence', 
    'tiempo_conserv', 
    'acciones'
  ];
  
  dataSource: any[] = [];

  constructor(
    private fb: FormBuilder, 
    private toastr: ToastrService,
    private dialog: MatDialog
  ) {
    this.formulario = this.fb.group({
      ctrol_puesto: [''],
      ctrol_estado: [''],
      ctrol_nombre_carpeta: [''],
      ctrol_nombre_documento: ['']
    });
  }

  ngOnInit(): void {
    this.lstPuestos = [{ codigo: '1', descripcion: 'Todos los puestos' }];
    this.lstEstados = [{ codigo: '1', descripcion: 'Cualquier estado' }];
    
    // Tabla inicial con carpeta mock
    this.dataSource = [
      { isFolder: true, nombre: '4. CONTEXTO DE LA ORGANIZACIÓN', expanded: false }
    ];
  }

  isGroup = (index: number, item: any): boolean => item.isFolder;

  onBuscar() {
    this.toastr.success('Búsqueda de documentos no controlados realizada', 'Éxito');
  }

  onNuevaCarpeta() {
    let dialogRef = this.dialog.open(DocumentosNoControladosRegeditCarpetaComponent, {
      width: '85vw',   
      height: '90vh',  
      maxWidth: '100vw',
      maxHeight: '100vh',
      disableClose: true,
      data: {}
    });
  }

  onArchivoImportado(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.toastr.success(`Archivo "${file.name}" listo para importar`, 'Importación');
    }
    event.target.value = ''; 
  }
}
