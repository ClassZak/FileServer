import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateGroupModalComponent } from './create-group-modal';

describe('CreateGroupModalComponent', () => {
	let component: CreateGroupModalComponent;
	let fixture: ComponentFixture<CreateGroupModalComponent>;

	beforeEach(async () => {
		TestBed.resetTestingModule();
		await TestBed.configureTestingModule({
			imports: [CreateGroupModalComponent]
		})
		.compileComponents();

		fixture = TestBed.createComponent(CreateGroupModalComponent);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
