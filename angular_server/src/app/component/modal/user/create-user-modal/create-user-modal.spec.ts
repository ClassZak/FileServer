import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateUserModalComponent } from './create-user-modal';

describe('CreateUserModalComponent', () => {
	let component: CreateUserModalComponent;
	let fixture: ComponentFixture<CreateUserModalComponent>;

	beforeEach(async () => {
		TestBed.resetTestingModule();
		await TestBed.configureTestingModule({
			imports: [CreateUserModalComponent]
		})
		.compileComponents();

		fixture = TestBed.createComponent(CreateUserModalComponent);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
