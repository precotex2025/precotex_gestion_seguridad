import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentosControladosComponent } from './documentos-controlados.component';

describe('DocumentosControladosComponent', () => {
  let component: DocumentosControladosComponent;
  let fixture: ComponentFixture<DocumentosControladosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DocumentosControladosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentosControladosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
