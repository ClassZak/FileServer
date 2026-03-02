import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelTable } from './model-table';

describe('ModelTable', () => {
  let component: ModelTable;
  let fixture: ComponentFixture<ModelTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModelTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModelTable);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
