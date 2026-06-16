import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NormasRegeditComponent } from './normas-regedit.component';

describe('NormasRegeditComponent', () => {
  let component: NormasRegeditComponent;
  let fixture: ComponentFixture<NormasRegeditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NormasRegeditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NormasRegeditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
