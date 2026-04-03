import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateUserModalComponent } from './update-user-modal';

describe('UpdateUserModalComponent', () => {
	let component: UpdateUserModalComponent;
	let fixture: ComponentFixture<UpdateUserModalComponent>;

	beforeEach(async () => {
		TestBed.resetTestingModule();
		await TestBed.configureTestingModule({
			imports: [UpdateUserModalComponent]
		})
		.compileComponents();

		fixture = TestBed.createComponent(UpdateUserModalComponent);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
