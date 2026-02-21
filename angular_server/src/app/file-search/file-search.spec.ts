import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileSearch } from './file-search';

describe('FileSearch', () => {
	let component: FileSearch;
	let fixture: ComponentFixture<FileSearch>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [FileSearch]
		})
		.compileComponents();

		fixture = TestBed.createComponent(FileSearch);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
