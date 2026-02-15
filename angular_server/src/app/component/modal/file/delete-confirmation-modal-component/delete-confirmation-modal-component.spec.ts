import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteConfirmationModalComponent } from './delete-confirmation-modal-component';

describe('DeleteConfirmationModalComponent', () => {
	let component: DeleteConfirmationModalComponent;
	let fixture: ComponentFixture<DeleteConfirmationModalComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [DeleteConfirmationModalComponent]
		})
		.compileComponents();

		fixture = TestBed.createComponent(DeleteConfirmationModalComponent);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
