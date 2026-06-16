import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MntoActivosComponent } from './mnto-activos.component';

describe('MntoActivosComponent', () => {
  let component: MntoActivosComponent;
  let fixture: ComponentFixture<MntoActivosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MntoActivosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MntoActivosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
