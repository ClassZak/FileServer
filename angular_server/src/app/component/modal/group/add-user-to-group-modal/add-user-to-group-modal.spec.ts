import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddUserToGroupModal } from './add-user-to-group-modal';

describe('AddUserToGroupModal', () => {
	let component: AddUserToGroupModal;
	let fixture: ComponentFixture<AddUserToGroupModal>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [AddUserToGroupModal]
		})
		.compileComponents();

		fixture = TestBed.createComponent(AddUserToGroupModal);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
