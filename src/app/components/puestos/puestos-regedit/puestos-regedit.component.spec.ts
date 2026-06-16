import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PuestosRegeditComponent } from './puestos-regedit.component';

describe('PuestosRegeditComponent', () => {
  let component: PuestosRegeditComponent;
  let fixture: ComponentFixture<PuestosRegeditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PuestosRegeditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PuestosRegeditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
