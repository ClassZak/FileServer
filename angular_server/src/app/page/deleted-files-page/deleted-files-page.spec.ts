import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeletedFilesPage } from './deleted-files-page';

describe('DeletedFilesPage', () => {
  let component: DeletedFilesPage;
  let fixture: ComponentFixture<DeletedFilesPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeletedFilesPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeletedFilesPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
