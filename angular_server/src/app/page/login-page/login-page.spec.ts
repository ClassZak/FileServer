import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginPage } from './login-page';
import { provideRouter } from '@angular/router';

describe('LoginPage', () => {
	let component: LoginPage;
	let fixture: ComponentFixture<LoginPage>;

	beforeEach(async () => {
		TestBed.resetTestingModule();
		
		await TestBed.configureTestingModule({
			imports: [LoginPage],
			providers: [provideRouter([])]
		})
		.compileComponents();

		fixture = TestBed.createComponent(LoginPage);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
