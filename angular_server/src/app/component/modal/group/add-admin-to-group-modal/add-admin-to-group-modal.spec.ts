import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddAdminToGroupModal } from './add-admin-to-group-modal';

describe('AddAdminToGroupModal', () => {
  let component: AddAdminToGroupModal;
  let fixture: ComponentFixture<AddAdminToGroupModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddAdminToGroupModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddAdminToGroupModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
