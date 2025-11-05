import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReviewShimmerComponent } from './review-shimmer.component';

describe('ReviewShimmerComponent', () => {
  let component: ReviewShimmerComponent;
  let fixture: ComponentFixture<ReviewShimmerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewShimmerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReviewShimmerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
