import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-bread-crumb',
  standalone: false,
  templateUrl: './bread-crumb.component.html',
  styleUrl: './bread-crumb.component.css'
})
export class BreadCrumbComponent {
  @Input() titulo: string = '';
  @Input() titulo2: string = '';
  @Input() subtitulo?: string;
  @Input() icon?: string;


}
