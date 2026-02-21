import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateGroupModal } from './update-group-modal';

describe('UpdateGroupModal', () => {
	let component: UpdateGroupModal;
	let fixture: ComponentFixture<UpdateGroupModal>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [UpdateGroupModal]
		})
		.compileComponents();

		fixture = TestBed.createComponent(UpdateGroupModal);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
