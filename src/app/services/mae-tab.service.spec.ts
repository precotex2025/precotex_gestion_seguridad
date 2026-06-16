import { TestBed } from '@angular/core/testing';

import { MaeTabService } from './mae-tab.service';

describe('MaeTabService', () => {
  let service: MaeTabService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MaeTabService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
