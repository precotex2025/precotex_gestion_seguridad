import { Component } from '@angular/core';

@Component({
  selector: 'app-placeholder',
  standalone: false,
  template: `
    <div class="placeholder-container sn-animate-in">
      <div class="placeholder-card shadow-premium">
        <mat-icon class="placeholder-icon">construction</mat-icon>
        <h2 class="placeholder-title">Módulo en Construcción</h2>
        <p class="placeholder-text">
          Esta sección está siendo desarrollada. Muy pronto estará disponible para su uso.
        </p>
        <button type="button" class="btn-back" routerLink="/principal">
          <mat-icon>arrow_back</mat-icon>
          <span>Regresar al Inicio</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .placeholder-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 250px);
      padding: 24px;
    }
    .placeholder-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 48px 32px;
      text-align: center;
      max-width: 480px;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .placeholder-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #8b5cf6;
      margin-bottom: 20px;
    }
    .placeholder-title {
      font-family: 'Inter', sans-serif;
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 12px;
    }
    .placeholder-text {
      font-family: 'Inter', sans-serif;
      font-size: 0.9rem;
      color: #64748b;
      margin-bottom: 30px;
      line-height: 1.5;
    }
    .btn-back {
      background: linear-gradient(135deg, #4f46e5, #8b5cf6);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-family: 'Inter', sans-serif;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
      transition: all 0.2s ease;
    }
    .btn-back:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(79, 70, 229, 0.4);
    }
    .btn-back mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
  `]
})
export class PlaceholderComponent {}
