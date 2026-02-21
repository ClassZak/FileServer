import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserRowGroupPage } from './user-row-group-page';

describe('UserRowGroupPage', () => {
	let component: UserRowGroupPage;
	let fixture: ComponentFixture<UserRowGroupPage>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [UserRowGroupPage]
		})
		.compileComponents();

		fixture = TestBed.createComponent(UserRowGroupPage);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
