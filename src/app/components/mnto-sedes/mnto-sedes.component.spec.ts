import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MntoSedesComponent } from './mnto-sedes.component';

describe('MntoSedesComponent', () => {
  let component: MntoSedesComponent;
  let fixture: ComponentFixture<MntoSedesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MntoSedesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MntoSedesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
