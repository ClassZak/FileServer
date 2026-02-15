import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RemoveUserFromGroupModal } from './remove-user-from-group-modal';

describe('RemoveUserFromGroupModal', () => {
	let component: RemoveUserFromGroupModal;
	let fixture: ComponentFixture<RemoveUserFromGroupModal>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [RemoveUserFromGroupModal]
		})
		.compileComponents();

		fixture = TestBed.createComponent(RemoveUserFromGroupModal);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
