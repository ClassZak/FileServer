import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoticeComponent } from './notice-component';

describe('NoticeComponent', () => {
	let component: NoticeComponent;
	let fixture: ComponentFixture<NoticeComponent>;

	beforeEach(async () => {
		TestBed.resetTestingModule();
		await TestBed.configureTestingModule({
			imports: [NoticeComponent]
		})
		.compileComponents();

		fixture = TestBed.createComponent(NoticeComponent);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
