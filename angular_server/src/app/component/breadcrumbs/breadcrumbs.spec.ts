import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BreadcrumbsComponent } from './breadcrumbs';

describe('BreadcrumbsComponent', () => {
	let component: BreadcrumbsComponent;
	let fixture: ComponentFixture<BreadcrumbsComponent>;

	beforeEach(async () => {
		TestBed.resetTestingModule();
		await TestBed.configureTestingModule({
			imports: [BreadcrumbsComponent]
		})
		.compileComponents();

		fixture = TestBed.createComponent(BreadcrumbsComponent);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
