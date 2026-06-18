import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentosNoControladosRegeditCarpetaComponent } from './documentos-no-controlados-regedit-carpeta.component';

describe('DocumentosNoControladosRegeditCarpetaComponent', () => {
  let component: DocumentosNoControladosRegeditCarpetaComponent;
  let fixture: ComponentFixture<DocumentosNoControladosRegeditCarpetaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DocumentosNoControladosRegeditCarpetaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentosNoControladosRegeditCarpetaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
