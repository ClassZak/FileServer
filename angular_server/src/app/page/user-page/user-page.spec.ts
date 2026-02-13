import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserPage } from './user-page';

describe('UserPage', () => {
  let component: UserPage;
  let fixture: ComponentFixture<UserPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
