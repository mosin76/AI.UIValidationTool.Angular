import { TestBed } from '@angular/core/testing';

import { ReviewImgService } from './review-img.service';

describe('ReviewImgService', () => {
  let service: ReviewImgService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReviewImgService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
