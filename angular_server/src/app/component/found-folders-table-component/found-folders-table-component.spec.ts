import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FoundFoldersTableComponent } from './found-folders-table-component';

describe('FoundFoldersTableComponent', () => {
	let component: FoundFoldersTableComponent;
	let fixture: ComponentFixture<FoundFoldersTableComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [FoundFoldersTableComponent]
		})
		.compileComponents();

		fixture = TestBed.createComponent(FoundFoldersTableComponent);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
