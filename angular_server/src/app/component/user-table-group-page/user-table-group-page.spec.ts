import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserTableGroupPage } from './user-table-group-page';

describe('UserTableGroupPage', () => {
  let component: UserTableGroupPage;
  let fixture: ComponentFixture<UserTableGroupPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserTableGroupPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserTableGroupPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
