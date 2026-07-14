import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrosPendientesComponent } from './registros-pendientes.component';

describe('RegistrosPendientesComponent', () => {
  let component: RegistrosPendientesComponent;
  let fixture: ComponentFixture<RegistrosPendientesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RegistrosPendientesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistrosPendientesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
