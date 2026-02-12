import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserTable } from './user-table';

describe('UserTable', () => {
  let component: UserTable;
  let fixture: ComponentFixture<UserTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserTable);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
