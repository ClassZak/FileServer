import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteGroupModal } from './delete-group-modal';

describe('DeleteGroupModal', () => {
	let component: DeleteGroupModal;
	let fixture: ComponentFixture<DeleteGroupModal>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [DeleteGroupModal]
		})
		.compileComponents();

		fixture = TestBed.createComponent(DeleteGroupModal);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
