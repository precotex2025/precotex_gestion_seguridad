import { Component, OnInit } from '@angular/core';
import { GlobalVariable } from './VarGlobals';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {

  title = 'proySecureNorm';

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      const vusu = localStorage.getItem('vusu');
      const vcodtra = localStorage.getItem('vcodtra');
      const vtiptra = localStorage.getItem('vtiptra');
      const vCod_Rol = localStorage.getItem('vCod_Rol');

      if (vusu) GlobalVariable.vusu = vusu;
      if (vcodtra) GlobalVariable.vcodtra = vcodtra;
      if (vtiptra) GlobalVariable.vtiptra = vtiptra;
      if (vCod_Rol) GlobalVariable.vCod_Rol = parseInt(vCod_Rol) || 0;
    }
  }

}


