import { TestBed } from '@angular/core/testing';

import { NormasService } from './normas.service';

describe('NormasService', () => {
  let service: NormasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NormasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
