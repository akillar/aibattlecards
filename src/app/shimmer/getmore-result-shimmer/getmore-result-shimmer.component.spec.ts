import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GetmoreResultShimmerComponent } from './getmore-result-shimmer.component';

describe('GetmoreResultShimmerComponent', () => {
  let component: GetmoreResultShimmerComponent;
  let fixture: ComponentFixture<GetmoreResultShimmerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GetmoreResultShimmerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GetmoreResultShimmerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
