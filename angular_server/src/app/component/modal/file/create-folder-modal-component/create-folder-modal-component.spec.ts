import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateFolderModalComponent } from './create-folder-modal-component';

describe('CreateFolderModalComponent', () => {
	let component: CreateFolderModalComponent;
	let fixture: ComponentFixture<CreateFolderModalComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [CreateFolderModalComponent]
		})
		.compileComponents();

		fixture = TestBed.createComponent(CreateFolderModalComponent);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
