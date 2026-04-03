import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateUserPasswordModalComponent } from './update-user-password-modal';

describe('UpdateUserPasswordModalComponent', () => {
	let component: UpdateUserPasswordModalComponent;
	let fixture: ComponentFixture<UpdateUserPasswordModalComponent>;

	beforeEach(async () => {
		TestBed.resetTestingModule();
		await TestBed.configureTestingModule({
			imports: [UpdateUserPasswordModalComponent]
		})
		.compileComponents();

		fixture = TestBed.createComponent(UpdateUserPasswordModalComponent);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
