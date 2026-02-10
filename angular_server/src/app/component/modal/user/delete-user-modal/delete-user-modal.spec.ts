import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteUserModal } from './delete-user-modal';

describe('DeleteUserModal', () => {
  let component: DeleteUserModal;
  let fixture: ComponentFixture<DeleteUserModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteUserModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeleteUserModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
