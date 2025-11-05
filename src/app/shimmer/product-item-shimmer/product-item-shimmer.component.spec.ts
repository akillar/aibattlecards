import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductItemShimmerComponent } from './product-item-shimmer.component';

describe('ProductItemShimmerComponent', () => {
  let component: ProductItemShimmerComponent;
  let fixture: ComponentFixture<ProductItemShimmerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductItemShimmerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProductItemShimmerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
