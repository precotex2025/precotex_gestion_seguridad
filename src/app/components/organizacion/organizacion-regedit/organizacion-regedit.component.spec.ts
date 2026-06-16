import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizacionRegeditComponent } from './organizacion-regedit.component';

describe('OrganizacionRegeditComponent', () => {
  let component: OrganizacionRegeditComponent;
  let fixture: ComponentFixture<OrganizacionRegeditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OrganizacionRegeditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrganizacionRegeditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
