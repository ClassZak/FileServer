import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileTableComponent } from './file-table-component';

describe('FileTableComponent', () => {
	let component: FileTableComponent;
	let fixture: ComponentFixture<FileTableComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [FileTableComponent]
		})
		.compileComponents();

		fixture = TestBed.createComponent(FileTableComponent);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
