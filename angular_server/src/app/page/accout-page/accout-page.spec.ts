import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccoutPage } from './accout-page';

describe('AccoutPage', () => {
	let component: AccoutPage;
	let fixture: ComponentFixture<AccoutPage>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [AccoutPage]
		})
		.compileComponents();

		fixture = TestBed.createComponent(AccoutPage);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
