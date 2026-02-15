import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FolderTableComponent } from './folder-table-component';

describe('FolderTableComponent', () => {
  let component: FolderTableComponent;
  let fixture: ComponentFixture<FolderTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FolderTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FolderTableComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
