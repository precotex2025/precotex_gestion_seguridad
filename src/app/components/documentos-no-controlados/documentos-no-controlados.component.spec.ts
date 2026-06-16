import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentosNoControladosComponent } from './documentos-no-controlados.component';

describe('DocumentosNoControladosComponent', () => {
  let component: DocumentosNoControladosComponent;
  let fixture: ComponentFixture<DocumentosNoControladosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DocumentosNoControladosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentosNoControladosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
