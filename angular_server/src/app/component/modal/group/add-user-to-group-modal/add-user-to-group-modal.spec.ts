import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddUserToGroupModalComponent } from './add-user-to-group-modal';

describe('AddUserToGroupModalComponent', () => {
	let component: AddUserToGroupModalComponent;
	let fixture: ComponentFixture<AddUserToGroupModalComponent>;

	beforeEach(async () => {
		TestBed.resetTestingModule();
		await TestBed.configureTestingModule({
			imports: [AddUserToGroupModalComponent]
		})
		.compileComponents();

		fixture = TestBed.createComponent(AddUserToGroupModalComponent);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
