import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateUserPasswordModal } from './update-user-password-modal';

describe('UpdateUserPasswordModal', () => {
	let component: UpdateUserPasswordModal;
	let fixture: ComponentFixture<UpdateUserPasswordModal>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [UpdateUserPasswordModal]
		})
		.compileComponents();

		fixture = TestBed.createComponent(UpdateUserPasswordModal);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
