import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddAdminToGroupModalComponent } from './add-admin-to-group-modal';

describe('AddAdminToGroupModalComponent', () => {
	let component: AddAdminToGroupModalComponent;
	let fixture: ComponentFixture<AddAdminToGroupModalComponent>;

	beforeEach(async () => {
		TestBed.resetTestingModule();
		await TestBed.configureTestingModule({
			imports: [AddAdminToGroupModalComponent]
		})
		.compileComponents();

		fixture = TestBed.createComponent(AddAdminToGroupModalComponent);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
