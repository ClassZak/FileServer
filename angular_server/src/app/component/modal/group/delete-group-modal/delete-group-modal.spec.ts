import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteGroupModalComponent } from './delete-group-modal';

describe('DeleteGroupModalComponent', () => {
	let component: DeleteGroupModalComponent;
	let fixture: ComponentFixture<DeleteGroupModalComponent>;

	beforeEach(async () => {
		TestBed.resetTestingModule();
		await TestBed.configureTestingModule({
			imports: [DeleteGroupModalComponent]
		})
		.compileComponents();

		fixture = TestBed.createComponent(DeleteGroupModalComponent);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
