import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileSearchComponent } from './file-search-component';

describe('FileSearchComponent', () => {
  let component: FileSearchComponent;
  let fixture: ComponentFixture<FileSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileSearchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FileSearchComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
