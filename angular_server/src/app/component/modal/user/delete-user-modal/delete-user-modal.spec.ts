import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteUserModalComponent } from './delete-user-modal';

describe('DeleteUserModalComponent', () => {
	let component: DeleteUserModalComponent;
	let fixture: ComponentFixture<DeleteUserModalComponent>;

	beforeEach(async () => {
		TestBed.resetTestingModule();
		await TestBed.configureTestingModule({
			imports: [DeleteUserModalComponent]
		})
		.compileComponents();

		fixture = TestBed.createComponent(DeleteUserModalComponent);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
