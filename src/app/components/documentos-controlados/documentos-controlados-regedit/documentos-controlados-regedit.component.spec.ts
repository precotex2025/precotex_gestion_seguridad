import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentosControladosRegeditComponent } from './documentos-controlados-regedit.component';

describe('DocumentosControladosRegeditComponent', () => {
  let component: DocumentosControladosRegeditComponent;
  let fixture: ComponentFixture<DocumentosControladosRegeditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DocumentosControladosRegeditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentosControladosRegeditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
