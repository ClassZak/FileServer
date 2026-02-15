import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupTable } from './group-table';

describe('GroupTable', () => {
	let component: GroupTable;
	let fixture: ComponentFixture<GroupTable>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [GroupTable]
		})
		.compileComponents();

		fixture = TestBed.createComponent(GroupTable);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
