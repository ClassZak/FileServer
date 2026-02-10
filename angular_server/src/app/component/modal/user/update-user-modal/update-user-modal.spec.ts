import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateUserModal } from './update-user-modal';

describe('UpdateUserModal', () => {
  let component: UpdateUserModal;
  let fixture: ComponentFixture<UpdateUserModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateUserModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateUserModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
