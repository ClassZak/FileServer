import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelTable } from './model-table';
import { FileInfo } from '../../core/model/file-info';

describe('ModelTable', () => {
	let component: ModelTable<FileInfo>;
	let fixture: ComponentFixture<ModelTable<FileInfo>>;

	beforeEach(async () => {
		TestBed.resetTestingModule();
		await TestBed.configureTestingModule({
			imports: [ModelTable]
		})
		.compileComponents();

		fixture = TestBed.createComponent(ModelTable<FileInfo>);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
