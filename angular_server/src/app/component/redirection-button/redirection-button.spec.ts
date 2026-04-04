import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RedirectionButton } from './redirection-button';
import { provideRouter } from '@angular/router';

describe('RedirectionButton', () => {
	let component: RedirectionButton;
	let fixture: ComponentFixture<RedirectionButton>;

	beforeEach(async () => {
		TestBed.resetTestingModule();
		await TestBed.configureTestingModule({
			imports: [RedirectionButton],
			providers: [provideRouter([])]
		})
		.compileComponents();

		fixture = TestBed.createComponent(RedirectionButton);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
