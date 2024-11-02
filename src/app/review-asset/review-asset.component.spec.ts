import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReviewAssetComponent } from './review-asset.component';

describe('ReviewAssetComponent', () => {
  let component: ReviewAssetComponent;
  let fixture: ComponentFixture<ReviewAssetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewAssetComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReviewAssetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
