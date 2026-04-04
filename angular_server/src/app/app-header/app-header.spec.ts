import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppHeader } from './app-header';
import { provideRouter } from '@angular/router';

describe('AppHeader', () => {
	let component: AppHeader;
	let fixture: ComponentFixture<AppHeader>;

	beforeEach(async () => {
		TestBed.resetTestingModule();
		await TestBed.configureTestingModule({
			imports: [AppHeader],
			providers: [provideRouter([])]
		})
		.compileComponents();

		fixture = TestBed.createComponent(AppHeader);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
