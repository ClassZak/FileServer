import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FoundFilesTableComponent } from './found-files-table-component';

describe('FoundFilesTableComponent', () => {
	let component: FoundFilesTableComponent;
	let fixture: ComponentFixture<FoundFilesTableComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [FoundFilesTableComponent]
		})
		.compileComponents();

		fixture = TestBed.createComponent(FoundFilesTableComponent);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
