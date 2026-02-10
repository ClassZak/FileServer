import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateUserModal } from './create-user-modal';

describe('CreateUserModal', () => {
  let component: CreateUserModal;
  let fixture: ComponentFixture<CreateUserModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateUserModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateUserModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
