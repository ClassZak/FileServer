import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileSearchHeader } from './file-search-header';

describe('FileSearchHeader', () => {
	let component: FileSearchHeader;
	let fixture: ComponentFixture<FileSearchHeader>;

	beforeEach(async () => {
		TestBed.resetTestingModule();
		await TestBed.configureTestingModule({
			imports: [FileSearchHeader]
		})
		.compileComponents();

		fixture = TestBed.createComponent(FileSearchHeader);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
