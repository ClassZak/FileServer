import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelTableTileComponent } from './model-table-tile-component';

describe('ModelTableTileComponent', () => {
	let component: ModelTableTileComponent;
	let fixture: ComponentFixture<ModelTableTileComponent>;

	beforeEach(async () => {
		TestBed.resetTestingModule();
		await TestBed.configureTestingModule({
			imports: [ModelTableTileComponent]
		})
		.compileComponents();

		fixture = TestBed.createComponent(ModelTableTileComponent);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
