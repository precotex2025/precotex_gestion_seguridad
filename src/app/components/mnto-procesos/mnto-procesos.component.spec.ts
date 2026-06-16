import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MntoProcesosComponent } from './mnto-procesos.component';

describe('MntoProcesosComponent', () => {
  let component: MntoProcesosComponent;
  let fixture: ComponentFixture<MntoProcesosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MntoProcesosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MntoProcesosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
