import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SedesRegeditComponent } from './sedes-regedit.component';

describe('SedesRegeditComponent', () => {
  let component: SedesRegeditComponent;
  let fixture: ComponentFixture<SedesRegeditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SedesRegeditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SedesRegeditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
