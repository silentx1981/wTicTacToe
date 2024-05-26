import { TestBed } from '@angular/core/testing';

import { PositionsmappingService } from './positionsmapping.service';

describe('PositionsmappingService', () => {
  let service: PositionsmappingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PositionsmappingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
