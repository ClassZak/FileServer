import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserRow } from './user-row';

describe('UserRow', () => {
	let component: UserRow;
	let fixture: ComponentFixture<UserRow>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [UserRow]
		})
		.compileComponents();

		fixture = TestBed.createComponent(UserRow);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
