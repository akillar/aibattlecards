import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PostSliderShimmerComponent } from './post-slider-shimmer.component';

describe('PostSliderShimmerComponent', () => {
  let component: PostSliderShimmerComponent;
  let fixture: ComponentFixture<PostSliderShimmerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostSliderShimmerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PostSliderShimmerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
