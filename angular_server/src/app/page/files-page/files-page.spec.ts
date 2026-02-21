import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilesPage } from './files-page';

describe('FilesPage', () => {
	let component: FilesPage;
	let fixture: ComponentFixture<FilesPage>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [FilesPage]
		})
		.compileComponents();

		fixture = TestBed.createComponent(FilesPage);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
