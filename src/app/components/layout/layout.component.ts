import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MatSidenav } from '@angular/material/sidenav';
import { GlobalVariable } from '../../VarGlobals';

@Component({
  selector: 'app-layout',
  standalone: false,
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent implements OnInit, OnDestroy {
  @ViewChild(MatSidenav) sidenav!: MatSidenav;

  userName: string = GlobalVariable.vusu || 'Administrador';
  isMobile: boolean = false;

  private resizeListener!: () => void;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.checkScreenSize();
    if (typeof window !== 'undefined') {
      this.resizeListener = () => this.checkScreenSize();
      window.addEventListener('resize', this.resizeListener);
    }
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined' && this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
  }

  private checkScreenSize(): void {
    if (typeof window !== 'undefined') {
      this.isMobile = window.innerWidth < 992;
    }
  }

  onNavListClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (this.isMobile && (target.closest('a') || target.closest('mat-list-item'))) {
      this.sidenav.close();
    }
  }

  onLogout(): void {
    this.router.navigate(['/login']);
  }
}
