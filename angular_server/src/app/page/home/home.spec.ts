import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Home } from './home';
import { provideRouter } from '@angular/router';

describe('Home', () => {
	let component: Home;
	let fixture: ComponentFixture<Home>;

	beforeEach(async () => {
		TestBed.resetTestingModule();
		
		await TestBed.configureTestingModule({
			imports: [Home],
			providers: [provideRouter([])]
		})
		.compileComponents();

		fixture = TestBed.createComponent(Home);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
