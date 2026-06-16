import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcesosRegeditComponent } from './procesos-regedit.component';

describe('ProcesosRegeditComponent', () => {
  let component: ProcesosRegeditComponent;
  let fixture: ComponentFixture<ProcesosRegeditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProcesosRegeditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProcesosRegeditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
